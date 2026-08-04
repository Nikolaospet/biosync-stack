/**
 * The single place that defines what Free gets and what Pro unlocks.
 *
 * Screens must read gates from here rather than checking `isPro` inline, so
 * pricing experiments never require hunting through the UI.
 */

/** RevenueCat entitlement identifier configured in the dashboard. */
export const PRO_ENTITLEMENT = "pro";

/** Offering identifier fetched from RevenueCat. `current` is used as fallback. */
export const DEFAULT_OFFERING = "default";

/** Cabinet size a free user can track before the paywall appears. */
export const FREE_ITEM_LIMIT = 8;

/** Insight cards a free user can read before the rest are locked. */
export const FREE_INSIGHT_LIMIT = 1;

export type Gate =
  | "unlimited-cabinet"
  | "full-insights"
  | "rule-tuning"
  | "barcode-scanner"
  | "expiry-scanner";

export const gateCopy: Record<Gate, { title: string; description: string }> = {
  "unlimited-cabinet": {
    title: "Track your whole cabinet",
    description: `Free tracks ${FREE_ITEM_LIMIT} supplements. Pro removes the limit entirely.`,
  },
  "full-insights": {
    title: "See every interaction",
    description:
      "Pro unlocks the full on-device analysis — conflicts, synergies and upper-limit warnings across your whole stack.",
  },
  "rule-tuning": {
    title: "Tune your own thresholds",
    description:
      "Set your zinc ceiling, mineral spacing and preferred magnesium block, then re-evaluate instantly.",
  },
  "barcode-scanner": {
    title: "Scan instead of typing",
    description:
      "Point the camera at a barcode and BioSync fills in the brand, pill count and price for you.",
  },
  "expiry-scanner": {
    title: "Capture expiry dates fast",
    description: "Read the printed date straight off the bottle instead of typing it in.",
  },
};

export const proBenefits = [
  "Unlimited supplements in your cabinet",
  "Full interaction, synergy and overdose analysis",
  "Custom rule thresholds and mineral spacing",
  "Barcode and expiry-date scanning",
  "Everything stays on your device — no account needed",
];
