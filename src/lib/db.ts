import Dexie, { type Table } from "dexie";

import {
  initialSupplements,
  type ActiveIngredient,
  type SupplementItem,
  type TimeOfDay,
} from "./supplements";

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
  activeIngredients: ActiveIngredient[];
}

/** User-tunable thresholds for the on-device rules engine. */
export interface RuleSettings {
  id: "default";
  zincLimitMg: number;
  copperSpacingHours: number;
  magnesiumBlock: TimeOfDay;
  checkZincCopper: boolean;
  checkD3K2: boolean;
  checkZincOverdose: boolean;
  checkMagnesiumTiming: boolean;
}

export const defaultRuleSettings: RuleSettings = {
  id: "default",
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
  id: "default";
  enabled: boolean;
  times: Record<TimeOfDay, string>;
  blocks: Record<TimeOfDay, boolean>;
  snoozeMinutes: number;
  lowStockAlerts: boolean;
  lowStockDays: number;
  expiryAlerts: boolean;
  expiryLeadDays: number;
}

export const defaultReminderSettings: ReminderSettings = {
  id: "default",
  enabled: true,
  times: { morning: "07:30", afternoon: "13:00", evening: "21:30" },
  blocks: { morning: true, afternoon: true, evening: true },
  snoozeMinutes: 15,
  lowStockAlerts: true,
  lowStockDays: 7,
  expiryAlerts: true,
  expiryLeadDays: 30,
};

/** Reads the persisted reminder settings, falling back to defaults. */
export async function loadReminderSettings(): Promise<ReminderSettings> {
  const db = getDb();
  if (!db) return defaultReminderSettings;
  return (await db.reminders.get("default")) ?? defaultReminderSettings;
}

/** Persists a partial reminder change and returns the merged settings. */
export async function saveReminderSettings(
  patch: Partial<Omit<ReminderSettings, "id">>,
) {
  const db = getDb();
  if (!db) return defaultReminderSettings;
  const current = await loadReminderSettings();
  const next: ReminderSettings = {
    ...current,
    ...patch,
    times: { ...current.times, ...(patch.times ?? {}) },
    blocks: { ...current.blocks, ...(patch.blocks ?? {}) },
    id: "default",
  };
  await db.reminders.put(next);
  return next;
}



class BioStackDB extends Dexie {
  cabinet!: Table<SupplementItem, string>;
  dailyLogs!: Table<DailyLog, string>;
  customCatalog!: Table<CatalogEntry, string>;
  ruleSettings!: Table<RuleSettings, string>;
  reminders!: Table<ReminderSettings, string>;


  constructor() {
    super("biostack");
    this.version(1).stores({
      cabinet: "id, name, category, timeOfDay, expirationDate, remainingPills",
      dailyLogs: "date",
      customCatalog: "barcode, name, brand",
    });
    this.version(2).stores({
      ruleSettings: "id",
    });
    this.version(3).stores({
      reminders: "id",
    });
  }
}


let instance: BioStackDB | null = null;

/** Lazily opens the local IndexedDB database. Returns null during SSR. */
export function getDb(): BioStackDB | null {
  if (typeof indexedDB === "undefined") return null;
  if (!instance) instance = new BioStackDB();
  return instance;
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** Seeds the starter stack the first time the app runs on this device. */
export async function ensureSeeded() {
  const db = getDb();
  if (!db) return;
  const count = await db.cabinet.count();
  if (count === 0) {
    await db.cabinet.bulkPut(initialSupplements);
  }
  const catalogCount = await db.customCatalog.count();
  if (catalogCount === 0) {
    await db.customCatalog.bulkPut(
      initialSupplements
        .filter((i) => i.barcode)
        .map((i) => ({
          barcode: i.barcode!,
          brand: i.brand,
          name: i.name,
          totalPills: i.totalPills,
          priceEstimate: i.priceEstimate,
          activeIngredients: i.activeIngredients ?? [],
        })),
    );
  }
}

/** Reads the persisted rule settings, falling back to defaults. */
export async function loadRuleSettings(): Promise<RuleSettings> {
  const db = getDb();
  if (!db) return defaultRuleSettings;
  return (await db.ruleSettings.get("default")) ?? defaultRuleSettings;
}

/** Persists a partial threshold change and returns the merged settings. */
export async function saveRuleSettings(patch: Partial<Omit<RuleSettings, "id">>) {
  const db = getDb();
  if (!db) return defaultRuleSettings;
  const next = { ...(await loadRuleSettings()), ...patch, id: "default" as const };
  await db.ruleSettings.put(next);
  return next;
}

/** Recomputes and persists today's completion score from the current cabinet. */
export async function writeDailyLog() {
  const db = getDb();
  if (!db) return;
  const items = await db.cabinet.toArray();
  const takenItems = items.filter((i) => i.takenToday).map((i) => i.id);
  const completionScore = items.length
    ? Math.round((takenItems.length / items.length) * 100)
    : 0;
  await db.dailyLogs.put({ date: todayKey(), takenItems, completionScore });
}

/** Resets takenToday flags when the device date rolls over to a new day. */
export async function rolloverIfNewDay() {
  const db = getDb();
  if (!db) return;
  const key = todayKey();
  const log = await db.dailyLogs.get(key);
  if (log) return;
  const items = await db.cabinet.toArray();
  if (items.some((i) => i.takenToday)) {
    await db.cabinet.bulkPut(items.map((i) => ({ ...i, takenToday: false })));
  }
  await db.dailyLogs.put({ date: key, takenItems: [], completionScore: 0 });
}
