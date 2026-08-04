import type { TimeOfDay } from "./supplements";

/** User-tunable thresholds for the on-device rules engine. */
export interface RuleSettings {
  zincLimitMg: number;
  copperSpacingHours: number;
  magnesiumBlock: TimeOfDay;
  checkZincCopper: boolean;
  checkD3K2: boolean;
  checkZincOverdose: boolean;
  checkMagnesiumTiming: boolean;
}

export const defaultRuleSettings: RuleSettings = {
  zincLimitMg: 45,
  copperSpacingHours: 4,
  magnesiumBlock: "evening",
  checkZincCopper: true,
  checkD3K2: true,
  checkZincOverdose: true,
  checkMagnesiumTiming: true,
};

/** Local dose reminders — times are "HH:MM" in device local time. */
export interface ReminderSettings {
  enabled: boolean;
  times: Record<TimeOfDay, string>;
  blocks: Record<TimeOfDay, boolean>;
  lowStockAlerts: boolean;
  lowStockDays: number;
  expiryAlerts: boolean;
  expiryLeadDays: number;
}

export const defaultReminderSettings: ReminderSettings = {
  enabled: true,
  times: { morning: "07:30", afternoon: "13:00", evening: "21:30" },
  blocks: { morning: true, afternoon: true, evening: true },
  lowStockAlerts: true,
  lowStockDays: 7,
  expiryAlerts: true,
  expiryLeadDays: 30,
};

export interface DailyLog {
  /** ISO date, e.g. 2026-08-04 */
  date: string;
  takenItems: string[];
  completionScore: number;
}

export interface CatalogEntry {
  barcode: string;
  brand: string;
  name: string;
  servingSize?: string;
  totalPills?: number;
  priceEstimate?: number;
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
