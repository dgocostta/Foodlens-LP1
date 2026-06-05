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
