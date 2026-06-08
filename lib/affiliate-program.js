// ---------------------------------------------------------------------------
// FoodLens Affiliate Program — SINGLE SOURCE OF TRUTH.
// The /join page, the Affiliate Kit (/field/kit), and the approval email all
// read from PROGRAM. Numbers are placeholders — edit them here, no redeploy
// mindset, no touching the pages.
// ---------------------------------------------------------------------------

export const PROGRAM = {
  statusName: 'Founding Partner',
  foundingCap: 50, // first N approved lock their top rate for life
  currency: '€',
  commission: {
    // recurring MRR share, RETROACTIVE, lifetime of the account
    basis: 'recurring monthly (MRR), for the life of the account',
    tiers: [
      { upTo: 10, rate: 20 }, // 1–10 active restaurants
      { upTo: 20, rate: 30 }, // 11–20
      { upTo: null, rate: 40 }, // 21+
    ],
    retroactive: true, // crossing a tier lifts ALL their restaurants to the new rate
  },
  bonuses: {
    foundingLockIn:
      'First 50 Founding Partners keep their top earned rate for life, even when public rates drop later.',
    fastStart: {
      amount: 50,
      withinDays: 30,
      label: 'Fast-Start bonus when your first restaurant goes paid within 30 days',
    },
    recruiter: {
      amount: 50,
      label:
        'Recruiter reward: one-time when an affiliate you refer lands their first paying restaurant',
    },
    milestones: [
      // status/spotlight now; cash amounts to be set later
      { active: 10, reward: 'Founding Partner badge + spotlight' },
      { active: 25, reward: 'Featured partner + priority support' },
      { active: 50, reward: 'Named partner status + rate review' },
    ],
  },
}

// --- Derived helpers (so pages stay DRY and consistent) -------------------

// Human label for a tier's restaurant range, e.g. "1–10", "11–20", "21+".
export function tierRangeLabel(tiers, index) {
  const prev = index === 0 ? 0 : tiers[index - 1].upTo
  const tier = tiers[index]
  const from = prev + 1
  if (tier.upTo == null) return `${from}+`
  return `${from}–${tier.upTo}`
}

// e.g. "€50"
export function money(amount) {
  return `${PROGRAM.currency}${amount}`
}

// Top (max) rate offered, used for the Founding lock-in headline.
export function topRate() {
  return Math.max(...PROGRAM.commission.tiers.map((t) => t.rate))
}

// ---------------------------------------------------------------------------
// Activation workspace — 7-day quick-start + ranks (Batch 3).
// Single source of truth so the dashboard, /field gate and the API agree.
// ---------------------------------------------------------------------------

// How many target restaurants the affiliate should line up before they're
// considered "ready" (the "list 20 restaurants" task auto-completes at this).
export const TARGET_RESTAURANTS = 20

// The quick-start, broken into individual tasks. `day` is SUGGESTED ORDER ONLY
// (nothing is time-locked). `mandatory` tasks gate unlock. `auto` tasks complete
// from an artifact instead of a manual tick.
export const QUICKSTART_TASKS = [
  { id: 'welcome', day: 1, mandatory: true, label: 'Watch the 3-min welcome video', hint: 'Start Here → Welcome video' },
  { id: 'policies', day: 1, mandatory: true, label: 'Read the rules: approved + banned messaging', hint: 'Policies → approved & banned messaging (and payout terms)' },
  { id: 'targets', day: 2, mandatory: true, auto: 'workbook_target', label: `List ${TARGET_RESTAURANTS} target restaurants in your Workbook`, hint: 'Workbook tab' },
  { id: 'outreach', day: 3, mandatory: false, label: 'Send 5 cold emails + 5 IG DMs', hint: 'Emails / DMs sections' },
  { id: 'reel', day: 4, mandatory: false, label: 'Post 1 Reel', hint: 'Social section' },
  { id: 'followup', day: 5, mandatory: false, label: 'Follow up with everyone who replied' },
  { id: 'walkin', day: 6, mandatory: false, label: 'Visit 2 venues with the one-pager', hint: 'Sales Tools → one-pager' },
  { id: 'logleads', day: 7, mandatory: false, label: 'Log every lead at your field intake' },
]

export const MANDATORY_TASK_IDS = QUICKSTART_TASKS.filter((t) => t.mandatory).map((t) => t.id)

// Is a task effectively done? Manual tasks read the checklist map; `auto` tasks
// derive from an artifact (e.g. the workbook target count).
export function isTaskDone(task, { checklist = {}, workbookCount = 0 } = {}) {
  if (!task) return false
  if (task.auto === 'workbook_target') return workbookCount >= TARGET_RESTAURANTS
  return !!(checklist[task.id] && checklist[task.id].done)
}

// Progress-based unlock: every MANDATORY task done → tracking link + kit unlock.
export function isUnlocked({ checklist = {}, workbookCount = 0 } = {}) {
  return QUICKSTART_TASKS.filter((t) => t.mandatory).every((t) => isTaskDone(t, { checklist, workbookCount }))
}

// ---------------------------------------------------------------------------
// Ranks — read-only labels DERIVED from CRM outcomes (paying = leads marked
// 'won'). NOTE: rank is intentionally independent of `foundingNumber`; the
// founding lock-in is a separate lifetime-rate PERK flag, not a rank input.
// Thresholds live here (not inline in pages) so points/badges can extend later.
// ---------------------------------------------------------------------------
export const RANKS = {
  labels: { promoter: 'Promoter', affiliate: 'Affiliate', founding: 'Founding Partner' },
  affiliateMinSigned: 1,
  // Top rank starts at the bottom of the top commission tier (e.g. 21 for 40%).
  foundingMinSigned:
    (PROGRAM.commission.tiers[PROGRAM.commission.tiers.length - 2]?.upTo || 0) + 1,
}

// signedCount = number of referred leads marked 'won' (paying). Workbook
// self-reported "signed" is display-only and never feeds rank.
export function computeRank(signedCount = 0) {
  const n = Number(signedCount) || 0
  if (n >= RANKS.foundingMinSigned) return RANKS.labels.founding
  if (n >= RANKS.affiliateMinSigned) return RANKS.labels.affiliate
  return RANKS.labels.promoter
}
