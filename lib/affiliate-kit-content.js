// ---------------------------------------------------------------------------
// Affiliate Kit content — DATA-DRIVEN. The /field/kit page renders entirely
// from KIT_SECTIONS. Structure mirrors Affiliate_Bank_Blueprint.md (folders
// 00–11). To add an asset later, add an entry here — no page code.
//
// Conventions:
//  - Swipe copy uses {{CODE}}, {{LINK}}, {{LINK_FIELD}}, {{NAME}} placeholders.
//    The Kit page substitutes {{CODE}} / {{LINK}} / {{LINK_FIELD}} live;
//    {{NAME}}, {{CITY}}, {{DISH}} are left for per-prospect find-and-replace.
//  - asset.type:
//      'copy'     -> copy-block with one or more tone variants (tabs/dropdown)
//      'download' -> downloadable creative/asset slot (files added later)
//  - asset.note can flag priority, e.g. 'P0 — files drop here' / 'P1 — soon'.
//  - section.phase ('P1'/'P2') labels a not-yet-started category.
//  - Everything below is PLACEHOLDER — replace bodies/files with real content.
//  - Priorities follow the blueprint: P0 = MVP, P1 = 30 days, P2 = 60 days.
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
`[PLACEHOLDER — 7-DAY FAST-START CHECKLIST]
Day 1 — Save your code {{CODE}} and link {{LINK}}. Skim every asset in this kit.
Day 2 — List 20 restaurants you can reach (DM, email, in person).
Day 3 — Send 5 cold emails + 5 IG DMs using the swipe copy below.
Day 4 — Post 1 Reel using a script from the Social section.
Day 5 — Follow up with everyone who opened / replied.
Day 6 — Walk into 2 venues with the one-pager.
Day 7 — Log every lead at {{LINK_FIELD}}. Review what landed.` },
        ],
      },
      {
        id: 'how-it-works', type: 'copy', title: 'How you get credited',
        variants: [
          { label: 'Read me', body:
`[PLACEHOLDER]
Every restaurant you bring in is credited to your code {{CODE}}.
Two ways to credit a lead:
1) You add them yourself at {{LINK_FIELD}} (enter your code, fill the form).
2) Share your link {{LINK}} — anyone who signs up through it is tagged to you.
Questions? Reply to your approval email.` },
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
          { label: '1 · Friendly', body: `[PLACEHOLDER — FRIENDLY/PERSONAL]\nSubject: Had your {{DISH}} last week…\n\nHi {{NAME}}, ... {{LINK}}` },
          { label: '2 · Direct', body: `[PLACEHOLDER — DIRECT/NO-FLUFF]\nSubject: Free dish videos for 100 restaurants\n\nHi {{NAME}}, I'll keep this short. ... {{LINK}}` },
          { label: '3 · Story', body: `[PLACEHOLDER — STORY-LED]\nSubject: How one clip doubled a restaurant's reach\n\nHi {{NAME}}, ... {{LINK}}` },
          { label: '4 · Problem', body: `[PLACEHOLDER — PROBLEM-LED]\nSubject: Your menu is invisible online\n\nHi {{NAME}}, ... {{LINK}}` },
          { label: '5 · Curiosity', body: `[PLACEHOLDER — CURIOSITY/PATTERN-INTERRUPT]\nSubject: Why 73% of {{CITY}} tourists check your menu first\n\nHi {{NAME}}, ... {{LINK}}` },
        ],
      },
      {
        id: 'audience-variants', type: 'copy', title: 'Audience variants (5)',
        note: 'Same offer, tuned to the decision-maker.',
        variants: [
          { label: 'Owner-operator', body: `[PLACEHOLDER — OWNER-OPERATOR, single location]\n... {{LINK}}` },
          { label: 'Manager / GM', body: `[PLACEHOLDER — MANAGER/GM, multi-location]\n... {{LINK}}` },
          { label: 'Restaurant group', body: `[PLACEHOLDER — GROUP / CHAIN HQ]\n... {{LINK}}` },
          { label: 'Hotel F&B', body: `[PLACEHOLDER — HOTEL F&B MANAGER]\n... {{LINK}}` },
          { label: 'Ghost kitchen', body: `[PLACEHOLDER — GHOST KITCHEN OPERATOR]\n... {{LINK}}` },
        ],
      },
      {
        id: 'contact-form', type: 'copy', title: 'Contact-form messages (3)',
        note: 'For venues with only a website contact form.',
        variants: [
          { label: 'Short', body: `[PLACEHOLDER — UNDER 500 CHARS]\nHi! ... {{LINK}}` },
          { label: 'Medium', body: `[PLACEHOLDER — 500–1,000 CHARS]\nHi {{NAME}} team, ... {{LINK}}` },
          { label: 'Long', body: `[PLACEHOLDER — FULL PITCH]\nHello, ... {{LINK}}` },
        ],
      },
      {
        id: 'subject-vault', type: 'copy', title: 'Subject-line vault (50+)',
        note: 'Swipe-tested subject lines — curiosity, direct, question, list, personal.',
        variants: [
          { label: 'Vault', body: `[PLACEHOLDER — 50+ SUBJECT LINES]\n1. ...\n2. ...\n3. ...` },
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
          { label: 'Cold · Friendly', body: `[PLACEHOLDER DM — FRIENDLY]\nYour {{DISH}} looks unreal 🤤 ... {{LINK}}` },
          { label: 'Cold · Direct', body: `[PLACEHOLDER DM — DIRECT]\nWe turn dishes into 5-sec clips ... {{LINK}}` },
          { label: 'Cold · Curiosity', body: `[PLACEHOLDER DM — CURIOSITY]\nQuick q — who does your menu videos? ... {{LINK}}` },
          { label: 'Warm follow-up', body: `[PLACEHOLDER DM — WARM FOLLOW-UP]\nFollowing up on my note 👀 ... {{LINK}}` },
        ],
      },
      {
        id: 'other-channels', type: 'copy', title: 'Other channels (5)',
        note: 'TikTok, LinkedIn, Facebook, WhatsApp, in person.',
        variants: [
          { label: 'TikTok DM', body: `[PLACEHOLDER — TIKTOK DM, casual]\n... {{LINK}}` },
          { label: 'LinkedIn DM', body: `[PLACEHOLDER — LINKEDIN, B2B chains/hotels]\n... {{LINK}}` },
          { label: 'Facebook DM', body: `[PLACEHOLDER — FB PAGE DM]\n... {{LINK}}` },
          { label: 'WhatsApp', body: `[PLACEHOLDER — WHATSAPP opener + follow-up]\n... {{LINK}}` },
          { label: 'Walk-in script', body: `[PLACEHOLDER — 30-SEC IN-PERSON SCRIPT]\n...` },
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
        note: 'Hook → demo → CTA. ~15–30s each.',
        variants: [
          { label: 'Reel 1', body: `[PLACEHOLDER REEL 1]\nHook: "Your menu is boring."\n...\nCTA: link in bio {{LINK}}` },
          { label: 'Reel 2', body: `[PLACEHOLDER REEL 2]\n...` },
          { label: 'Reel 3', body: `[PLACEHOLDER REEL 3]\n...` },
          { label: 'Reel 4', body: `[PLACEHOLDER REEL 4]\n...` },
          { label: 'Reel 5', body: `[PLACEHOLDER REEL 5]\n...` },
          { label: 'Reel 6', body: `[PLACEHOLDER REEL 6]\n...` },
          { label: 'Reel 7', body: `[PLACEHOLDER REEL 7]\n...` },
          { label: 'Reel 8 · Testimonial', body: `[PLACEHOLDER REEL 8]\n...` },
          { label: 'Reel 9 · BTS', body: `[PLACEHOLDER REEL 9]\n...` },
          { label: 'Reel 10 · FAQ', body: `[PLACEHOLDER REEL 10]\n...` },
        ],
      },
      {
        id: 'tiktok-scripts', type: 'copy', title: 'TikTok scripts (10)',
        note: 'Punchier hooks than IG. Adapt freely.',
        variants: [
          { label: 'TikTok 1', body: `[PLACEHOLDER TIKTOK 1]\n...` },
          { label: 'TikTok 2', body: `[PLACEHOLDER TIKTOK 2]\n...` },
          { label: 'TikTok 3', body: `[PLACEHOLDER TIKTOK 3]\n...` },
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
      { id: 'one-pager', type: 'download', title: 'One-pager (PDF)', note: 'P0 — leave-behind PDF drops here.', items: ['FoodLens one-pager — A4 PDF'] },
      {
        id: 'battle-card', type: 'copy', title: 'Objection battle card',
        note: 'Top objections + best response. Memorize these.',
        variants: [
          { label: 'Battle card', body:
`[PLACEHOLDER — OBJECTION BATTLE CARD]
"I already have a QR menu" → ours has video + translation + analytics.
"Sounds expensive" → it's affordable, with a Founding offer.
"I don't have time for setup" → a few days, 1 photo per dish, we do the rest.
"I'm not tech-savvy" → no app, no install, just a QR code.
... (add the rest)` },
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
          { label: 'Long-form', body: `[PLACEHOLDER — LONG-FORM LANDING COPY]\nHeadline ...\nSub ...\nCTA → {{LINK}}` },
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
          { label: 'Read me', body: `[PLACEHOLDER — TOP 10 MISTAKES]\n1. ...\n2. ...\n3. ...` },
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
        variants: [{ label: 'Summary', body: `[PLACEHOLDER — AFFILIATE AGREEMENT SUMMARY]\nFull terms link: ...` }],
      },
      {
        id: 'messaging-rules', type: 'copy', title: 'Approved & banned messaging',
        note: 'Stay compliant — protects your commissions.',
        variants: [{ label: 'Do / Don’t', body: `[PLACEHOLDER]\nApproved: honest benefits, real examples.\nBanned: bought lists, fake reviews, deceptive claims, brand-bidding on Google Ads.` }],
      },
      {
        id: 'payouts', type: 'copy', title: 'Payout terms & schedule',
        variants: [{ label: 'How you get paid', body: `[PLACEHOLDER — PAYOUT TERMS]\nWhen + how commissions are paid. See your program summary above for rates.` }],
      },
    ],
  },
]
