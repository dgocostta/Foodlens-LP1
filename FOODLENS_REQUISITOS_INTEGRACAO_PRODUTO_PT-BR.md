# FoodLens — Requisitos de Integração (lado do Produto)

**Para:** o desenvolvedor do produto (app foodlensgroup.com — Next.js 16 / React 19 / Prisma / NextAuth v4 / Stripe / EasyPanel-Docker)
**De:** Diego (lado de marketing / leads / afiliados — demo.foodlensgroup.com)
**Data:** 9 de junho de 2026
**Prioridade:** o mais rápido que for razoável — já temos restaurantes e afiliados na fila.

## 1. Objetivo — onboarding tipo "funil compartilhável" (modelo ClickFunnels)
Nossos afiliados montam o **cardápio em vídeo** completo de um restaurante do nosso lado (cardápio escaneado/digitado, pratos + fotos/vídeos capturados ao vivo no local). Eles compartilham um link com o dono do restaurante. O dono vê o **cardápio pronto** (preview) e a única forma de usar/gerenciar é criar uma conta na FoodLens. O link de compartilhamento leva direto a um **checkout específico daquele cardápio** (plano já pré-selecionado, cardápio já carregado) — e **não** para a página genérica de planos. Ao pagar, o cardápio é vinculado à nova conta e entra no ar. O dono "reivindica" um produto pronto; ele nunca precisa "montar" nada.

A página genérica de planos continua como está, para visitantes frios/aleatórios. Este fluxo é para os leads quentes que nossos afiliados criam.

## 2. Fluxo de ponta a ponta
1. Nosso lado monta o cardápio e faz um **POST para um endpoint de importação do produto** → o produto cria um **restaurante + cardápio em estado "staged" (não reivindicado)**, carregando o **código do afiliado**. Retorna uma **URL de preview** + uma **URL de claim (reivindicação)**.
2. O afiliado compartilha a **URL de preview** com o dono (somente leitura; reutiliza a renderização existente de `/menu/<id>`).
3. O dono clica em **Reivindicar / Usar este cardápio** → a **URL de claim** = um checkout vinculado àquele cardápio staged, com o **plano pré-selecionado** e o código do afiliado carregado.
4. O dono se cadastra (NextAuth) + paga (Stripe) nesse fluxo.
5. **Webhook do Stripe → o produto vincula o cardápio staged à nova conta, ativa (entra no ar) e registra o código do afiliado.**
6. **O produto chama nosso webhook de atribuição** para nos avisar que o restaurante pagou e qual afiliado recebe o crédito (e, depois: renovações / cancelamentos).

## 3. O que precisa ser construído (lado do produto)

### 3.1 API de importação / "staged menu"
Endpoint **serviço-a-serviço** autenticado (API key/secret em um header — não uma sessão de usuário).
`POST /api/integrations/staged-menus`
```jsonc
{
  "affiliateCode": "FL-MARIA-7G2",
  "suggestedPlan": { "tier": "premium", "interval": "yearly" },   // pré-selecionar no checkout
  "sourceLeadId": "id-do-nosso-lead",                             // para re-staging idempotente
  "restaurant": {
    "name": "The Exchange",
    "slogan": "Bar & Restaurant",
    "instagram": "@theexchange",
    "currency": "EUR",
    "logoUrl": "https://.../logo.png"
  },
  "categories": [ { "name": "Small Plates", "order": 1, "public": true } ],
  "dishes": [
    {
      "categoryName": "Small Plates",
      "translations": {
        "en": { "name": "...", "shortDescription": "...", "ingredients": "..." },
        "ptBR": { ... }, "ptPT": { ... }, "es": { ... }      // qualquer uma pode ser omitida; o auto-translate do produto pode preencher
      },
      "price": 15.50,
      "photoUrl": "https://.../dish.jpg",
      "videoUrl": "https://.../dish.mp4",                     // opcional; só aparece em planos com vídeo
      "extras": [ { "name": "Add chicken", "price": 4.00 } ],
      "bestSeller": false,
      "showInMenu": true
    }
  ]
}
```
- **Resposta:** `{ "stagedId": "...", "previewUrl": "...", "claimUrl": "..." }`
- **Mídia:** o produto deve **baixar a foto/vídeo/logo a partir das URLs fornecidas e re-hospedar** no seu próprio storage (nossas URLs são links duráveis do Firebase). Confirmar a abordagem preferida (baixar vs. nós enviarmos os arquivos).
- **Idempotente:** reenviar (POST) com o mesmo `sourceLeadId` (enquanto ainda não reivindicado) deve **atualizar** o cardápio staged, para os afiliados poderem revisar antes de o dono reivindicar.
- **Nenhuma conta de dono existe ainda** nesse momento — o restaurante staged precisa ficar sem dono até ser reivindicado.

### 3.2 Estados do "staged menu" + preview
- Estados: `unclaimed` (não reivindicado) → `claimed/active` (reivindicado/ativo) (e idealmente `expired` se nunca for reivindicado após N dias).
- **URL de preview:** pública, somente leitura, reutiliza a renderização de cardápio existente, com um aviso tipo "Preview — reivindique para entrar no ar". O dono não pode gerenciar/editar.

### 3.3 Checkout de claim dedicado
- A `claimUrl` → um checkout **vinculado ao cardápio staged**, com o **plano pré-selecionado** a partir de `suggestedPlan` e o **código do afiliado + stagedId carregados como metadata do Stripe**. Pula a página genérica de planos.
- O novo dono se cadastra (NextAuth) e paga ali. Se já tiver conta, permitir login + vincular.

### 3.4 Vínculo de claim (webhook do Stripe)
No `checkout.session.completed` / assinatura bem-sucedida:
- Criar/ativar a conta do dono, **vincular `stagedId` → dono**, colocar o cardápio no ar (respeitando `showInMenu`).
- **Regra de plano/limite:** se o cardápio staged tiver mais pratos do que o plano escolhido permite, definir a regra — recomendado: manter todos os pratos mas ocultar automaticamente o excedente até o upgrade (e mostrar "faça upgrade para exibir mais N"). Pratos marcados com vídeo só aparecem em planos com vídeo (Growth/Premium).
- Gravar o `affiliateCode` no registro do restaurante/assinatura.

### 3.5 Webhook de atribuição de afiliado  ★ ESSENCIAL — não existe hoje
O produto não tem nenhum conceito de afiliado hoje. Precisamos que ele **reporte as conversões pagas e os eventos do ciclo de vida de volta para nós**, para podermos pagar comissões (recorrentes, por faixa/tier, retroativas). Na ativação, renovação e cancelamento:
`POST {OUR_BASE_URL}/api/affiliate-conversions`  (assinado com HMAC usando um secret compartilhado)
```jsonc
{
  "event": "activated" | "renewed" | "canceled" | "past_due",
  "affiliateCode": "FL-MARIA-7G2",
  "restaurantId": "id-do-restaurante-no-produto",
  "sourceLeadId": "id-do-nosso-lead",
  "plan": { "tier": "premium", "interval": "yearly" },
  "amount": 690.00, "currency": "EUR",
  "stripeCustomerId": "cus_...",
  "occurredAt": "2026-06-15T10:00:00Z"
}
```
- Nós fornecemos a URL do endpoint + o secret compartilhado. Retentativas em caso de falha são bem-vindas.

## 4. Segurança
- Endpoint de importação: API key/secret de serviço (header), com rate limit.
- Webhook de atribuição: assinatura HMAC sobre o corpo, com secret compartilhado.
- O checkout de claim deve rejeitar um `stagedId` já reivindicado.

## 5. O que o nosso lado fornece / é responsável
- A UI de construção do cardápio, a montagem do cardápio e a mídia (URLs duráveis do Firebase).
- O código do afiliado + o plano sugerido em cada cardápio staged.
- O receptor `/api/affiliate-conversions` + o secret compartilhado.
- Consumimos `previewUrl` / `claimUrl` e os exibimos para afiliados/donos.

## 6. Perguntas em aberto para o desenvolvedor
1. Existe alguma **API interna / de admin** já disponível para construirmos em cima, ou hoje todo acesso a dados é só via sessão de usuário?
2. **Mídia:** o produto consegue baixar/re-hospedar a partir de URLs externas, ou você prefere que a gente envie os arquivos? Há limite de tamanho?
3. **Stripe:** confirmar se o Checkout consegue pré-selecionar um plano + carregar `affiliateCode`/`stagedId` na metadata.
4. **Restaurante sem dono:** é possível um restaurante + cardápio existir sem um usuário dono, e ser vinculado depois no claim? Precisa de mudanças no modelo (Prisma)?
5. **Regra de limite de pratos** no claim, quando o cardápio excede o plano escolhido — combinar o comportamento (recomendo ocultar o excedente).
6. Qualquer coisa aqui que conflite com a forma como o schema do Prisma / a propriedade (ownership) do NextAuth estão modelados hoje.

## 7. Ordem de construção sugerida (para começarmos a integrar cedo)
1. **API de importação** (3.1) + modelo de staged-menu & preview (3.2) — libera a gente para montar e exibir cardápios imediatamente.
2. **Checkout de claim dedicado + vínculo** (3.3–3.4) — transforma previews em contas pagas e no ar.
3. **Webhook de atribuição de afiliado** (3.5) — para as comissões serem rastreadas desde a primeira conversão paga. (Pode entrar junto com o item 2; não pode ser pulado.)

Vamos alinhar o nosso lado (formato do pacote de exportação + o receptor de conversões) ao que for mais fácil para você — estes são um ponto de partida, não contratos fixos.

---
*Observação: este documento é a versão em português (PT-BR) de `INTEGRATION_REQUIREMENTS_PRODUCT.md`. Termos técnicos (endpoint, webhook, API key, payload, Stripe Checkout, metadata, etc.) foram mantidos em inglês por convenção.*
