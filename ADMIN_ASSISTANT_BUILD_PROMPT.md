# Build: Admin AI Assistant — phased (spec for Claude Code, when we reach it)

An agentic copilot embedded in `/admin` for Diego + Patric. Build in this repo. Read CLAUDE.md first.
**Do NOT build this yet — Lead Bank ships first.** This is the spec for when we get here.

## Locked decisions
- **Brain:** Claude API (Anthropic). New env var `ANTHROPIC_API_KEY` — server-side only, never exposed to the browser.
- **Safety (non-negotiable):** reads are free; every WRITE action requires an explicit **confirm** tap in the UI
  before it executes. Log every action. Everything reversible.
- **Access:** admin-only (behind `ADMIN_KEY`); one shared assistant for Diego + Patric for now.
- **Notifications:** email (Resend) first; WhatsApp later (Phase B).
- **Memory:** persistent `soul.md` + `memory.md`, assistant-maintained, with a scheduled reflection (Hermes-style).

## Phase A — Reactive copilot (build first, keep lean)
- **UI:** a chat panel/tab in `/admin` (dark charcoal theme). Message list + input; tool-call confirmations shown inline.
- **Endpoint:** `POST /api/assistant/chat` (ADMIN_KEY). Sends the conversation + tool schema to the Claude API
  (tool use); executes tools server-side against Firestore; returns the reply. Persist threads (a collection) so
  conversations continue.
- **Tools — start MINIMAL (read + a few safe writes; all writes confirmed):**
  - Reads: `get_stats` (new leads, pending affiliates, new leadBank, etc.), `list_leads(filter)`,
    `list_affiliates(status)`, `search_leadbank(filter)`.
  - Writes (confirm-before-execute): `set_lead_status(id,status)`, `assign_leadbank(ids|filter, affiliateCode)`,
    `set_affiliate_status(code, approved|paused)` — approving reuses the existing code-generation + email flow.
  - Keep the write set small; expand only when the day-to-day proves the need.
- **Confirmation UX:** when the model wants a write, UI shows "About to: <action> — Confirm?"; nothing runs until tapped.
- **Logging:** every action → an `assistantLog` collection (who/what/when) for audit + undo.
- **Email:** reuse `lib/email.js` for any "notify Diego/Patric" message (formal record).

## Memory design (soul.md + memory.md)
- `soul.md`: the assistant's identity, how it works with Diego + Patric, tone, guardrails. Rarely changes.
- `memory.md`: accumulated context — decisions, preferences, ongoing tasks, who's who. Grows over time.
- **Scheduled reflection:** a **Vercel Cron** (every ~2–3h) hits `POST /api/assistant/reflect` → assistant
  distills recent activity/log into memory.md (append + periodic compaction so it doesn't bloat).
- Store as Firestore docs (`assistant/soul`, `assistant/memory`) or Storage files; editable from admin. Loaded at
  the start of every chat so the assistant carries context.

## Phase B — Proactive + reminders + WhatsApp (later)
- **Proactive alerts:** Vercel Cron checker for new leads, pending affiliates, due follow-ups → notify via email now,
  WhatsApp once integrated.
- **WhatsApp:** via a provider (Twilio / Meta Cloud API) — a real integration (business number, opt-in, small cost).
- **Reminders/tasks:** a `tasks` collection the assistant creates/reads; surfaces + notifies when due.
- **Scraping-via-assistant:** once the direct-Apify-in-admin (Lead Bank Phase 2) exists, add a `run_scrape` tool.

## Phase C — Autonomy (later)
- Multi-step workflows (scrape → dedupe → assign → draft outreach), preference learning, richer memory.

## Constraints
- `ANTHROPIC_API_KEY` server-side only. Admin-only. Confirm-before-write. Log everything. Purely **additive**
  (new endpoints + a tab; do not touch the live public/affiliate flows). Reuse existing API operations as the tool
  implementations rather than duplicating logic.
