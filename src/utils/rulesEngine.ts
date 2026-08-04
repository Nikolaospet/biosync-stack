import { defaultRuleSettings, type RuleSettings } from "../lib/db";
import {
  deriveIngredients,
  type SupplementItem,
  type TimeOfDay,
} from "../lib/supplements";

export interface RuleAlert {
  id: string;
  type: "synergy" | "conflict" | "overdose" | "timing";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  actionableStep: string;
}

const has = (items: SupplementItem[], re: RegExp) =>
  items.filter((i) => re.test(i.name) || re.test(i.brand));

function dailyMg(items: SupplementItem[], ingredient: string) {
  return items.reduce((sum, item) => {
    const match = deriveIngredients(item).find(
      (ing) => ing.name.toLowerCase() === ingredient.toLowerCase(),
    );
    return match ? sum + match.amountMg * Math.max(item.dailyDose, 1) : sum;
  }, 0);
}

const sameBlock = (a: SupplementItem[], b: SupplementItem[]): TimeOfDay | null => {
  for (const x of a) for (const y of b) if (x.timeOfDay === y.timeOfDay) return x.timeOfDay;
  return null;
};

/**
 * Deterministic, fully on-device stack evaluation. No network calls, no API cost.
 */
export function evaluateStackLocally(
  cabinetItems: SupplementItem[],
  settings: RuleSettings = defaultRuleSettings,
): RuleAlert[] {
  const alerts: RuleAlert[] = [];
  const items = cabinetItems.filter((i) => i.remainingPills > 0 || i.dailyDose > 0);

  // 1. Zinc + Copper compete for the same transporter.
  const zinc = has(items, /zinc|zma/i);
  const copper = has(items, /copper/i);
  if (settings.checkZincCopper && zinc.length && copper.length) {
    const clash = sameBlock(zinc, copper);
    alerts.push({
      id: "zinc-copper",
      type: "conflict",
      severity: clash ? "medium" : "low",
      title: "Zinc competing with Copper",
      description: clash
        ? `${zinc[0]!.name} and ${copper[0]!.name} are both scheduled in your ${clash} block. They share the same intestinal transporter, so absorption of both drops.`
        : `Zinc and Copper are in your stack in separate blocks — good separation. Keep at least ${settings.copperSpacingHours} hours between them.`,
      actionableStep: clash
        ? `Move ${copper[0]!.name} to a different block (lunch works well).`
        : "No change needed — keep the current spacing.",
    });
  }

  // 2. Vitamin D3 + K2 synergy.
  const d3 = has(items, /\bd3\b|vitamin d/i);
  const k2 = has(items, /\bk2\b|vitamin k|mk-?7/i);
  if (settings.checkD3K2 && d3.length && k2.length) {
    const withFood = [...d3, ...k2].every((i) => i.takeWithFood);
    alerts.push({
      id: "d3-k2",
      type: "synergy",
      severity: "low",
      title: "Vitamin D3 + K2 synergy",
      description:
        "K2 directs the calcium mobilised by D3 into bone rather than soft tissue — an ideal pairing in your stack.",
      actionableStep: withFood
        ? "Keep taking both with your fattiest meal for peak absorption."
        : "Flag both as 'with food' — they are fat-soluble and absorb poorly on an empty stomach.",
    });
  }

  // 3. Total daily Zinc above the 45mg upper limit.
  const zincMg = dailyMg(items, "Zinc");
  if (settings.checkZincOverdose && zincMg > settings.zincLimitMg) {
    alerts.push({
      id: "zinc-overdose",
      type: "overdose",
      severity: "high",
      title: `Zinc load at ${Math.round(zincMg)}mg/day`,
      description: `Your active stack totals ${Math.round(zincMg)}mg of elemental Zinc per day, above your ${settings.zincLimitMg}mg tolerable upper limit. Chronic excess suppresses copper status.`,
      actionableStep: "Drop the standalone Zinc on days you take a multivitamin or ZMA.",
    });
  }

  // 4. Magnesium Glycinate scheduled outside the evening block.
  const mag = has(items, /magnesium/i);
  const misTimed = mag.filter((i) => i.timeOfDay !== settings.magnesiumBlock);
  if (settings.checkMagnesiumTiming && misTimed.length) {
    alerts.push({
      id: "magnesium-timing",
      type: "timing",
      severity: "medium",
      title: `Magnesium outside your ${settings.magnesiumBlock} block`,
      description: `${misTimed[0]!.name} is in your ${misTimed[0]!.timeOfDay} block. Glycinate is mildly sedating and delivers most of its benefit as a single well-timed dose.`,
      actionableStep: `Move it to the ${settings.magnesiumBlock} block.`,
    });
  } else if (settings.checkMagnesiumTiming && mag.length) {
    alerts.push({
      id: "magnesium-timing-ok",
      type: "timing",
      severity: "low",
      title: "Magnesium timing optimal",
      description: `Your magnesium sits in your preferred ${settings.magnesiumBlock} block.`,
      actionableStep: "Take it on an empty stomach with lights dimmed.",
    });
  }

  return alerts;
}

/** Rough 0–100 health score derived purely from local alerts. */
export function localStackScore(alerts: RuleAlert[], itemCount: number) {
  const penalty = alerts.reduce((sum, a) => {
    if (a.type === "synergy") return sum - 3;
    return sum + (a.severity === "high" ? 18 : a.severity === "medium" ? 8 : 0);
  }, 0);
  return Math.max(20, Math.min(99, 92 + Math.min(itemCount, 12) - penalty));
}
