// ---------------------------------------------------------------------------
// Affiliate Kit content — DATA-DRIVEN. The /field/kit page renders entirely
// from KIT_SECTIONS. Structure mirrors Affiliate_Bank_Blueprint.md (folders
// 00–11). To add an asset later, add an entry here — no page code.
//
// Conventions:
//  - Swipe copy uses {{CODE}}, {{LINK}}, {{LINK_FIELD}} (live-substituted on the
//    dashboard) and {{NAME}}, {{CITY}} (default Dublin), {{DISH}} (left literal
//    for per-prospect find-and-replace).
//  - asset.type:
//      'copy'     -> copy-block with one or more tone variants (tabs/dropdown)
//      'download' -> downloadable creative/asset slot (files added later)
//  - asset.note can flag priority, e.g. 'P0 — files drop here' / 'P1 — soon'.
//  - section.phase ('P1'/'P2') labels a not-yet-started category.
//  - Real swipe copy wired from Affiliate_Bank_Copy_DRAFT.md; 'download' assets
//    are file drops; a couple of bodies keep bracketed TODOs for Diego.
// ---------------------------------------------------------------------------

export const KIT_SECTIONS = [
  // 00 ----------------------------------------------------------------------
  {
    code: '00', id: 'start', icon: 'Rocket', title: 'Start Here',
    blurb: 'Everything you need on day one.',
    assets: [
      {
        id: 'checklist', type: 'copy', title: '7-day Fast-Start checklist',
        note: 'Hit this and your first restaurant can go paid inside 30 days.',
        variants: [
          { label: 'Checklist', body:
`Day 1 — Save your code {{CODE}} and link {{LINK}}. Open every section of this dashboard once.
Day 2 — In your Workbook, list 20 restaurants you can realistically reach (DM, email, walk in).
Day 3 — Send 5 cold emails + 5 Instagram DMs using sections 01 and 02. Personalise the [brackets].
Day 4 — Post 1 Reel using a script from section 03. Put your link in your bio.
Day 5 — Follow up with everyone who opened or replied. Most yeses come on the follow-up.
Day 6 — Walk into 2 venues with the one-pager (section 06). Offer to photograph a few dishes on the spot.
Day 7 — Log every interested venue at {{LINK_FIELD}} so it's credited to you. Review and double down.

Remember your edge: as a Founding-100 affiliate you can offer concierge setup + 2 months free, and you bring the dish photos — the owner does almost nothing. That's how you turn a "maybe" into a "yes."

Pitch the Premium plan on annual billing only — that's what earns the restaurant Founding Member status. Lead with Premium; only fall back to Growth (€39) or Starter (€12) if you're about to lose the deal.` },
        ],
      },
      {
        id: 'how-it-works', type: 'copy', title: 'How you get credited',
        variants: [
          { label: 'Read me', body:
`Every restaurant you bring in is credited to your code {{CODE}} — for the life of that account.

Two ways to credit a venue:
1. You log them at {{LINK_FIELD}} — enter your code, fill the short form (best for venues you meet).
2. They use your link — share {{LINK}}; anyone who signs up through it is tagged to you.

You earn recurring commission every month that restaurant stays subscribed.
Questions? Reply to your approval email — it reaches the partnerships team.` },
        ],
      },
      { id: 'welcome-video', type: 'download', title: 'Welcome video (Diego, 3 min)', note: 'P0 — video drops here.', items: ['Welcome / how-the-program-works — MP4 / link'] },
      { id: 'brand-guide', type: 'download', title: 'Approved messaging & brand guide', note: 'P0 — 1-page PDF drops here.', items: ['Brand voice + do/don’t — PDF'] },
    ],
  },

  // 01 ----------------------------------------------------------------------
  {
    code: '01', id: 'emails', icon: 'Mail', title: 'Emails',
    blurb: 'Outreach that gets replies. Swap [brackets] / {{NAME}} per prospect.',
    assets: [
      {
        id: 'cold-emails', type: 'copy', title: 'Cold outreach emails (5 tones)',
        note: 'Five angles — pick the one that fits the venue.',
        variants: [
          { label: '1 · Friendly', body:
`Subject: Your {{DISH}} deserves better than a photo

Hi {{NAME}},
I had your {{DISH}} recently — genuinely brilliant — but the menu doesn't do it justice.
I work with FoodLens: we turn each dish into a short video diners watch by scanning a QR code at the table. A still photo sits there; a video makes people order it. It also auto-translates into English, Spanish and Portuguese, so tourists order with confidence.
Worth a quick look? {{LINK}}
Either way, keep doing what you're doing with that {{DISH}}.
[Your name]` },
          { label: '2 · Direct', body:
`Subject: Video menus for {{CITY}} restaurants

Hi {{NAME}},
I'll keep this short. FoodLens turns your dishes into short videos diners watch via a QR code at the table — they order faster, spend a bit more, and tourists can read the menu in English, Spanish or Portuguese. No app.
60-second look: {{LINK}}
Not for you? No worries at all.
[Your name]` },
          { label: '3 · Story', body:
`Subject: How one clip changed a restaurant's menu

Hi {{NAME}},
A {{CITY}} restaurant I work with swapped flat menu photos for short dish videos — diners scan a QR at the table and watch the food before they order. Desserts they'd normally skip started selling, and tourists stopped defaulting to the safe option.
That's FoodLens, and your {{DISH}} would shine on it. Quick look: {{LINK}}
Happy to walk you through it whenever suits.
[Your name]` },
          { label: '4 · Problem', body:
`Subject: Your menu is invisible online

Hi {{NAME}},
Diners decide with their eyes, but a wall of text — or a blurry PDF — sells nothing. Your best dishes get overlooked and tourists order the safe, cheap thing.
FoodLens fixes that: each dish becomes a short video diners watch via a QR at the table, auto-translated into EN/ES/PT. The menu does the selling for you — higher tickets, faster service.
Here's how it looks: {{LINK}}
Worth a quick chat?
[Your name]` },
          { label: '5 · Curiosity', body:
`Subject: A QR code most {{CITY}} tourists actually scan

Hi {{NAME}},
Quick one — when a tourist can't picture (or read) your menu, do they order your signature dish or the cheapest safe option?
FoodLens makes it easy: scan a QR at the table, watch each dish as a short video, translated into their language. Restaurants use it to push their best, most profitable plates.
60-second look: {{LINK}}
[Your name]` },
        ],
      },
      {
        id: 'audience-variants', type: 'copy', title: 'Audience variants (5)',
        note: 'Same offer, tuned to the decision-maker.',
        variants: [
          { label: 'Owner-operator', body:
`Subject: Make {{NAME}}'s menu sell for you

Hi {{NAME}},
As the owner you feel every slow night. FoodLens turns your dishes into short videos diners watch via a QR at the table — they order faster and reach for the dishes you actually want to sell. Setup's the easy part: with our Founding offer we set the account up for you and I'll come take the dish photos myself.
Quick look: {{LINK}}
[Your name]` },
          { label: 'Manager / GM', body:
`Subject: One video-menu standard across your sites

Hi {{NAME}},
Keeping the menu experience consistent across sites is a headache. FoodLens gives every location the same polished video menu — diners scan, watch each dish, EN/ES/PT translation — with analytics on what's actually viewed. Easy to roll out site by site.
Overview: {{LINK}}
[Your name]` },
          { label: 'Restaurant group', body:
`Subject: Video menus, brand-consistent across the group

Hi {{NAME}},
For a group your size, FoodLens standardises the on-table digital menu everywhere: short dish videos via QR, EN/ES/PT translation, plus view-level analytics. We can pilot one site and scale.
Happy to send a short deck or jump on a call: {{LINK}}
[Your name]` },
          { label: 'Hotel F&B', body:
`Subject: A menu your international guests can actually read

Hi {{NAME}},
Your guests come from everywhere. FoodLens puts a video menu on every table via QR, auto-translated into English, Spanish and Portuguese — guests see each dish and order with confidence, no app. Great for the restaurant and room service alike.
Quick look: {{LINK}}
[Your name]` },
          { label: 'Ghost kitchen', body:
`Subject: Make delivery dishes look irresistible

Hi {{NAME}},
Delivery lives and dies on how the food looks. FoodLens gives each dish a short, appetising video you can link from your QR and ordering pages — customers see the food at its best and order more.
See how it works: {{LINK}}
[Your name]` },
        ],
      },
      {
        id: 'contact-form', type: 'copy', title: 'Contact-form messages (3)',
        note: 'For venues with only a website contact form.',
        variants: [
          { label: 'Short', body:
`Hi! I work with FoodLens — we turn restaurant dishes into short videos diners watch via a QR code at the table (auto-translated EN/ES/PT, no app). {{NAME}}'s menu would look great on it and there's a Founding offer on right now. 60-sec look: {{LINK}} — thanks!` },
          { label: 'Medium', body:
`Hi {{NAME}} team,
I help restaurants with FoodLens — short video clips of each dish that diners watch by scanning a QR at the table. Diners order faster and reach for your best dishes; tourists get the menu in English, Spanish or Portuguese; and you see which dishes get the most attention.
We're in a Founding phase (first 100 restaurants): we set the whole account up for you and I take the dish photos myself, so it's no work on your end. Quick look: {{LINK}}
Who's the best person to speak to? Thanks!
[Your name]` },
          { label: 'Long', body:
`Hello,
I'd love to introduce {{NAME}} to FoodLens. We turn each dish into a short, appetising video diners watch simply by scanning a QR code at the table — no app, and auto-translated into English, Spanish and Portuguese, which is a real help with tourists.
Why restaurants switch: (1) the menu sells for you — diners order faster and pick higher-margin dishes (people who'd skip dessert change their mind when they see it); (2) international guests order confidently instead of defaulting to the cheapest safe option; (3) you get analytics on which dishes people actually watch.
Right now we're onboarding our first 100 Founding restaurants: concierge setup (we build the account) plus 2 months free, and the affiliate takes the dish photos — so it's genuinely no hassle for you.
60-second overview: {{LINK}}
If you can point me to whoever handles the menu or marketing, I'll keep it brief. Thank you!
[Your name]` },
        ],
      },
      {
        id: 'subject-vault', type: 'copy', title: 'Subject-line vault (30)',
        note: 'Swipe-tested subject lines — curiosity, direct, question, list, personal.',
        variants: [
          { label: 'Vault', body:
`CURIOSITY
1. A QR code most tourists actually scan
2. Your {{DISH}} deserves better than a photo
3. The menu trick {{CITY}} restaurants are using
4. What your menu isn't telling diners
5. Why guests order the safe dish
6. Your best plate is invisible right now

DIRECT
7. Video menus for {{CITY}} restaurants
8. Short dish videos, no app
9. A menu that sells for you
10. A better menu for {{NAME}}
11. QR menu + video + translation
12. 60 seconds on FoodLens

QUESTION
13. Who does {{NAME}}'s menu videos?
14. Can your tourists read your menu?
15. Still using a PDF menu?
16. What's your most-watched dish?
17. Mind if I show you something?
18. Worth 10 minutes?

LIST / VALUE
19. 3 reasons your menu should move
20. The 1-photo-per-dish menu upgrade
21. Sell more dessert without asking
22. From flat menu to video in days
23. The menu that pushes your best dish

PERSONAL / FOUNDING
24. Had your {{DISH}} — one idea
25. {{NAME}}: a Founding spot (first 100)
26. For the owner of {{NAME}}
27. We'll set it up + shoot the photos
28. Small idea for your menu
29. Following up, {{NAME}}
30. Last note from me, {{NAME}}` },
        ],
      },
      { id: 'email-sequences', type: 'download', title: 'Sequences — nurture, re-engagement, seasonal', note: 'P1 — soon.', items: ['5-step nurture sequence', '3-step re-engagement', 'Webinar invite sequence', 'Holiday / seasonal'] },
    ],
  },

  // 02 ----------------------------------------------------------------------
  {
    code: '02', id: 'dms', icon: 'Instagram', title: 'DMs & Messaging',
    blurb: 'Short, casual, mobile-first openers.',
    assets: [
      {
        id: 'ig-dms', type: 'copy', title: 'Instagram DMs (cold + warm)',
        note: 'Keep it human. One line, then the link.',
        variants: [
          { label: 'Cold · Friendly', body:
`Your {{DISH}} looks unreal 🤤 We turn dishes into short videos diners watch via a QR at the table (no app, translated EN/ES/PT). Would look amazing on {{NAME}}'s menu — and right now we set it up for you and I shoot the photos. Mind if I send a 60-sec look? {{LINK}}` },
          { label: 'Cold · Direct', body:
`Hi {{NAME}} 👋 We make video menus — scan a QR at the table, watch each dish, EN/ES/PT, no app. Diners order faster and spend a bit more. Worth a quick look? {{LINK}}` },
          { label: 'Cold · Curiosity', body:
`Quick q — who looks after your menu videos? We do short dish clips diners watch via QR at the table. Happy to show what it'd look like for {{NAME}} (we even take the photos): {{LINK}}` },
          { label: 'Warm follow-up', body:
`Hey {{NAME}}, following up 👀 No pressure — here's the 60-sec overview: {{LINK}} We're onboarding the first 100 restaurants with free setup, so happy to hold a spot if it's of interest.` },
        ],
      },
      {
        id: 'other-channels', type: 'copy', title: 'Other channels (5)',
        note: 'TikTok, LinkedIn, Facebook, WhatsApp, in person.',
        variants: [
          { label: 'TikTok DM', body:
`yo your food looks 🔥 we turn dishes into short vids people watch by scanning a QR at the table, no app. would look unreal for {{NAME}} — we set it up + shoot it. can I send a quick look? {{LINK}}` },
          { label: 'LinkedIn DM', body:
`Hi {{NAME}}, I work with FoodLens — on-table video menus via QR: short dish videos, EN/ES/PT translation, plus engagement analytics. We help multi-site operators standardise the menu and support international guests. Brief overview useful? {{LINK}}` },
          { label: 'Facebook DM', body:
`Hi! We make video menus for restaurants — diners scan a QR at the table and watch each dish (translated EN/ES/PT, no app). {{NAME}}'s menu would look great on it, and there's a Founding offer with free setup right now. Quick look: {{LINK}}` },
          { label: 'WhatsApp', body:
`Opener: Hi {{NAME}}, [Your name] here — I help restaurants with FoodLens video menus (QR at the table, short dish videos, EN/ES/PT, no app). We're onboarding the first 100 with concierge setup. Could I send a 60-sec overview? {{LINK}}

Follow-up (2 days): Hi {{NAME}}, floating this back up 🙂 happy to pop in and photograph a couple of dishes so you can see it on your own menu.` },
          { label: 'Walk-in script', body:
`"Hi — is the owner or manager around? … Hi {{NAME}}, I'll be quick. I work with FoodLens — we turn your dishes into short videos diners watch by scanning a QR code right at the table. They order faster, and tourists can read it in English, Spanish or Portuguese. Right now we're onboarding the first 100 restaurants: we set the whole thing up and I'll even take the dish photos — almost no work for you. Could I grab your best email or number and send a 60-second clip?"` },
        ],
      },
    ],
  },

  // 03 ----------------------------------------------------------------------
  {
    code: '03', id: 'social', icon: 'Share2', title: 'Social Posts',
    blurb: 'Scripts to make your own content and tag your link.',
    assets: [
      {
        id: 'reel-scripts', type: 'copy', title: 'IG Reel scripts (10)',
        note: 'Hook → demo → CTA. ~15–30s each. 1–5 ready; 6–10 to follow.',
        variants: [
          { label: 'Reel 1', body:
`Reel 1 — "Boring menu"
Hook (0–2s): "Your menu is doing you dirty." [plain text/PDF menu]
Body (2–12s): "Diners decide with their eyes. A wall of text sells nothing." [cut to FoodLens video menu on a phone via QR] "Scan, watch, order. Translated EN/ES/PT. No app."
CTA (12–15s): "This is FoodLens. Link in bio 👇 {{LINK}}"` },
          { label: 'Reel 2', body:
`Reel 2 — "Tourist test"
Hook: "Watch a tourist try to order off this." [text-only menu, confused face]
Body: "Now watch this." [QR scan → dish videos, translated] "Every dish as a short video, in their language."
CTA: "Restaurants — link in bio {{LINK}}"` },
          { label: 'Reel 3', body:
`Reel 3 — "Sell more dessert"
Hook: "How to sell more dessert without saying a word."
Body: [QR scan → dessert video] "When they SEE it, they order it. FoodLens turns each dish into a short video right on the table."
CTA: "Want it for your restaurant? {{LINK}}"` },
          { label: 'Reel 4', body:
`Reel 4 — "Signature dish"
Hook: "Your best dish is hiding at the bottom of the menu."
Body: [QR scan → signature dish video front and centre] "FoodLens puts your best, most profitable plates in motion so they sell themselves."
CTA: "Link in bio {{LINK}}"` },
          { label: 'Reel 5', body:
`Reel 5 — "POV diner"
Hook: "POV: you sit down and the menu actually shows you the food."
Body: [first-person: scan QR, scroll dish videos, pick one] "No app. Translated. Just scan and watch."
CTA: "FoodLens — for restaurants that refuse to go quietly. {{LINK}}"` },
          { label: 'Reel 6', body: `Coming soon — testimonial script lands here.` },
          { label: 'Reel 7', body: `Coming soon — behind-the-scenes setup script lands here.` },
          { label: 'Reel 8 · Testimonial', body: `Coming soon — FAQ / objections script lands here.` },
          { label: 'Reel 9 · BTS', body: `Coming soon — before/after script lands here.` },
          { label: 'Reel 10 · FAQ', body: `Coming soon — founder note script lands here.` },
        ],
      },
      {
        id: 'tiktok-scripts', type: 'copy', title: 'TikTok scripts (3)',
        note: 'Punchier hooks than IG. Adapt freely.',
        variants: [
          { label: 'TikTok 1', body: `"Restaurants still using paper menus in 2026… we need to talk." → QR-scan demo → "FoodLens. Link in bio {{LINK}}"` },
          { label: 'TikTok 2', body: `"I scanned a QR menu and the food was MOVING." → reaction + demo → "Tell your favourite restaurant: {{LINK}}"` },
          { label: 'TikTok 3', body: `"Things your menu should do but doesn't:" → list over demo (move, translate EN/ES/PT, push your best dish) → "{{LINK}}"` },
        ],
      },
      { id: 'social-templates', type: 'download', title: 'Carousels, LinkedIn, X, FB, Pinterest, Stories', note: 'P1 — soon.', items: ['5 carousel templates', 'LinkedIn B2B posts', 'X / Twitter threads', 'Facebook group posts', 'Pinterest pins', 'Story templates'] },
    ],
  },

  // 04 ----------------------------------------------------------------------
  {
    code: '04', id: 'creatives', icon: 'ImageIcon', title: 'Creatives & Banners',
    blurb: 'Ready-made ad creative. Files drop in here.',
    assets: [
      { id: 'display-banners', type: 'download', title: 'Display banners (5 sizes)', note: 'P0 — files drop here.', items: ['728×90 — Leaderboard', '300×250 — Medium rectangle', '160×600 — Skyscraper', '320×50 — Mobile', '970×250 — Billboard'] },
      { id: 'social-ads', type: 'download', title: 'Social ad sizes (4)', note: 'P0 — files drop here.', items: ['1080×1080 (1:1) — IG feed / FB', '1080×1920 (9:16) — Stories / Reels / TikTok', '1080×1350 (4:5) — IG portrait', '1920×1080 (16:9) — YouTube / FB video'] },
      { id: 'creative-extras', type: 'download', title: 'Brand kit + editable templates', note: 'P1 — soon.', items: ['Email header images', 'Logo pack + colors + fonts', 'Editable Canva / Figma templates', 'Before/after video pairs'] },
    ],
  },

  // 05 ----------------------------------------------------------------------
  {
    code: '05', id: 'video', icon: 'Video', title: 'Video Assets',
    blurb: 'Ready-to-share product video.',
    assets: [
      { id: 'demo-90s', type: 'download', title: '90-second demo video', note: 'P0 — clip / link drops here.', items: ['90s product demo — MP4 / link'] },
      { id: 'video-extras', type: 'download', title: 'Long demos, founder pitch, testimonials', note: 'P1 — soon.', items: ['3-min & 7-min demos', 'Founder pitch (60s)', '5 customer testimonials', 'Sample live menus', 'Music / SFX pack'] },
    ],
  },

  // 06 ----------------------------------------------------------------------
  {
    code: '06', id: 'sales', icon: 'Presentation', title: 'Sales Tools',
    blurb: 'What to show — and how to handle objections.',
    assets: [
      { id: 'one-pager', type: 'download', title: 'One-pager (PDF)', note: 'P0 — ready. A4 PDF, print or send.', items: [{ label: 'FoodLens one-pager — A4 PDF (Premium Founding offer)', href: '/foodlens-affiliate-onepager.pdf' }] },
      {
        id: 'battle-card', type: 'copy', title: 'Objection battle card',
        note: 'Top objections + best response. Memorize these.',
        variants: [
          { label: 'Battle card', body:
`"I already have a QR menu." → Most are just a PDF. FoodLens is video + EN/ES/PT translation + analytics — the menu actually sells.

"Sounds expensive." → The Founding package is the full Premium video menu, set up for you, with 2 months free — it pays for itself on a few extra desserts a week. (Downsell only if you're about to lose them: Growth €39/mo or Starter €12/mo.)

"I don't have time to set it up." → That's the best part — we build the account and your affiliate takes the dish photos. You barely lift a finger.

"I'm not tech-savvy." → Nothing to install, for you or your diners. It's a QR code.

"My food photos are fine." → Photos sit still. Video shows the dish the way it looks when it lands — that's what drives the order (and the dessert).

"We're too busy / fully booked." → Then it's about higher-margin orders and faster turns, not more covers. Video nudges diners to your best plates and speeds up ordering.

"Tourists aren't a big deal for us." → Even locals order more when they can see the dish. Translation (EN/ES/PT) is a bonus, not the whole pitch.

"We tried something like this before." → What went wrong? FoodLens is video-first, no app, and we set it up for you — the usual reasons these fail.

"Can I see other restaurants using it?" → Absolutely — scan this live menu right now: {{LINK}}

"Send me info." → Done — I'll send a 60-second clip and a one-pager today. Best email? (Then log them at {{LINK_FIELD}}.)

"What's the catch / contract?" → No long lock-in; monthly, quarterly or yearly. You stay because it works.

"We'd need head office to approve." → Happy to send a short deck. Who should I address it to?

"How is this better than Instagram?" → Instagram is discovery; this is at the table, at the moment of ordering, with no scrolling away.

"Does it work on all phones?" → Any phone with a camera. Scan the QR, it opens in the browser. Nothing to download.

"Why go through you?" → I'll set you up, take your dish photos, and make sure it's worth it. You get a real person, not a form — and a Founding rate locked in.` },
        ],
      },
      { id: 'sales-extras', type: 'download', title: 'ROI calc, comparison, stats, case studies', note: 'P1 — soon.', items: ['ROI calculator (Google Sheet)', 'Comparison sheet vs paper / PDF / competitors', 'Industry stats pack', 'Case study deck (5+ Founding Members)'] },
    ],
  },

  // 07 ----------------------------------------------------------------------
  {
    code: '07', id: 'webinar', icon: 'MonitorPlay', title: 'Webinar Kit', phase: 'P1',
    blurb: 'White-label deck, script, reminder + follow-up sequences.',
    assets: [],
  },

  // 08 ----------------------------------------------------------------------
  {
    code: '08', id: 'landing', icon: 'LayoutTemplate', title: 'Landing Pages',
    blurb: 'Affiliate-branded pages to send traffic to.',
    assets: [
      {
        id: 'lp-longform', type: 'copy', title: 'Landing page copy — long-form',
        note: 'Drop into your own page builder; swap {{LINK}}.',
        variants: [
          { label: 'Long-form', body:
`Headline: The menu that shows your food, not just lists it.
Sub: FoodLens turns every dish into a short video your diners watch by scanning a QR code at the table — auto-translated into English, Spanish & Portuguese, no app, any phone.

The problem: Diners decide with their eyes, but most menus are a wall of text or a blurry PDF. Your best dishes get overlooked and tourists play it safe.

The fix: Scan → watch → order. Each dish becomes a short, appetising video in the diner's language. Your signature, higher-margin plates sell themselves.

Why restaurants switch: Order faster (faster service, lower staff cost) · order more (dessert and upsell impulse) · tourists order confidently · analytics on what diners watch · light setup — one photo per dish.

Founding offer (first 100): the full Premium video menu (annual) — concierge setup + 2 months free. Become a Founding Member.

CTA (top & bottom): See a live menu → {{LINK}}` },
        ],
      },
      { id: 'lp-variations', type: 'download', title: 'Short, video-first, bridge, VSL, city variants', note: 'P1 — soon.', items: ['Short template', 'Video-first template', 'Bridge page', 'Thank-you page', 'VSL page', 'City variants (Dublin, Lisbon, Madrid…)'] },
    ],
  },

  // 09 ----------------------------------------------------------------------
  {
    code: '09', id: 'training', icon: 'GraduationCap', title: 'Training',
    blurb: 'Get to your first sale fast, then level up.',
    assets: [
      {
        id: 'top-mistakes', type: 'copy', title: 'Top 10 mistakes',
        note: 'What kills affiliate momentum — avoid these.',
        variants: [
          { label: 'Read me', body:
`1. Hitting "mark complete" without doing the steps — the work is the point, not the badge.
2. Messaging 100 venues once instead of 20 venues three times. Follow-up is where the yeses live.
3. Pitching features ("video menu!") instead of outcomes (bigger tickets, faster service, tourists ordering well).
4. Talking to the wrong person — get to the owner or manager, not the host stand.
5. Not using your edge — you can offer concierge setup + 2 months free and take the photos. Lead with that.
6. Forgetting to log leads at {{LINK_FIELD}} — if it's not logged, it's not credited to you.
7. Going quiet after "send me info." Send it the same day, follow up in two.
8. Over-promising. Never guarantee results — it breaks the rules and your credibility.
9. Buying email lists or spamming. Instant ban, and it poisons deliverability for everyone.
10. Giving up at day 5. Most first signups land in weeks 2–4, not day 1.` },
        ],
      },
      { id: 'training-course', type: 'download', title: '“First Sale in 7 Days” + launch plan', note: 'P1 — soon.', items: ['5-video mini-course', '30-day launch plan', 'Recorded monthly calls', 'Recommended tools list'] },
    ],
  },

  // 10 ----------------------------------------------------------------------
  {
    code: '10', id: 'contests', icon: 'Trophy', title: 'Contests & Leaderboard', phase: 'P1',
    blurb: 'Monthly contest, live leaderboard, winners’ playbooks.',
    assets: [],
  },

  // 11 ----------------------------------------------------------------------
  {
    code: '11', id: 'policies', icon: 'ShieldCheck', title: 'Policies',
    blurb: 'The rules of the road. Read before you promote.',
    assets: [
      {
        id: 'agreement', type: 'copy', title: 'Affiliate agreement',
        variants: [{ label: 'Summary', body:
`By promoting FoodLens you agree to: represent the product honestly, use only approved messaging, never make guaranteed-results or misleading claims, and follow the banned-tactics list below. Commissions are paid on restaurants credited to your code that become and remain paying customers. FoodLens may pause or remove an affiliate for breaching these terms. Full terms: [LINK TO FULL AGREEMENT — to add].` }],
      },
      {
        id: 'messaging-rules', type: 'copy', title: 'Approved & banned messaging',
        note: 'Stay compliant — protects your commissions.',
        variants: [{ label: 'Do / Don’t', body:
`Approved: honest benefits (video menu, EN/ES/PT translation, no app, analytics, faster service, higher tickets), real examples and live demos, your genuine experience, and the real pricing/Founding offer.

Banned: bought or scraped email lists · fake reviews or testimonials · guaranteed-income or "triple your revenue" claims · impersonating FoodLens staff · bidding on "FoodLens" / brand terms in Google Ads · any deceptive or pressure tactics. Breaking these risks removal and forfeited commissions.` }],
      },
      {
        id: 'payouts', type: 'copy', title: 'Payout terms & schedule',
        variants: [{ label: 'How you get paid', body:
`You earn recurring commission on every paying restaurant credited to your code, for as long as they stay subscribed. Rates follow your program tiers (see the rate card on your dashboard Home). Crossing a tier is retroactive — it lifts the rate on every venue you've signed. The first 50 Founding Partners keep their top earned rate for life. Payouts are made [MONTHLY — confirm cadence + method + minimum]. Fast-Start and Recruiter bonuses are paid after the referred restaurant's first paid month.` }],
      },
    ],
  },
]
