import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  defaultReminderSettings,
  defaultRuleSettings,
  type CatalogEntry,
  type DailyLog,
  type ReminderSettings,
  type RuleSettings,
} from "@/domain/settings";
import { initialSupplements, type SupplementItem } from "@/domain/supplements";

const SCHEMA_VERSION = 1;

const KEYS = {
  version: "biosync:v",
  cabinet: "biosync:cabinet",
  logs: "biosync:logs",
  catalog: "biosync:catalog",
  rules: "biosync:rules",
  reminders: "biosync:reminders",
  onboarded: "biosync:onboarded",
} as const;

/** Everything the app keeps on device. Nothing here leaves the phone. */
export interface PersistedState {
  cabinet: SupplementItem[];
  logs: DailyLog[];
  catalog: CatalogEntry[];
  rules: RuleSettings;
  reminders: ReminderSettings;
  onboarded: boolean;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // A corrupt or partially-written entry must never brick the app.
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the in-memory state stays correct for
    // this session, so we degrade rather than crash.
  }
}

/** Loads all persisted slices, seeding the starter stack on first launch. */
export async function loadState(): Promise<PersistedState> {
  const version = await readJson<number>(KEYS.version, 0);
  const onboarded = await readJson<boolean>(KEYS.onboarded, false);

  if (version === 0 && !onboarded) {
    const seeded = initialSupplements();
    const state: PersistedState = {
      cabinet: seeded,
      logs: [],
      catalog: seeded
        .filter((i) => i.barcode)
        .map((i) => ({
          barcode: i.barcode!,
          brand: i.brand,
          name: i.name,
          totalPills: i.totalPills,
          priceEstimate: i.priceEstimate,
        })),
      rules: defaultRuleSettings,
      reminders: defaultReminderSettings,
      onboarded: false,
    };
    await saveAll(state);
    await writeJson(KEYS.version, SCHEMA_VERSION);
    return state;
  }

  const [cabinet, logs, catalog, rules, reminders] = await Promise.all([
    readJson<SupplementItem[]>(KEYS.cabinet, []),
    readJson<DailyLog[]>(KEYS.logs, []),
    readJson<CatalogEntry[]>(KEYS.catalog, []),
    readJson<RuleSettings>(KEYS.rules, defaultRuleSettings),
    readJson<ReminderSettings>(KEYS.reminders, defaultReminderSettings),
  ]);

  return {
    cabinet: Array.isArray(cabinet) ? cabinet : [],
    logs: Array.isArray(logs) ? logs : [],
    catalog: Array.isArray(catalog) ? catalog : [],
    // Merge against defaults so a settings key added in a later release is
    // never `undefined` on a device upgraded from an older build.
    rules: { ...defaultRuleSettings, ...rules },
    reminders: {
      ...defaultReminderSettings,
      ...reminders,
      times: { ...defaultReminderSettings.times, ...reminders?.times },
      blocks: { ...defaultReminderSettings.blocks, ...reminders?.blocks },
    },
    onboarded,
  };
}

export async function saveAll(state: PersistedState) {
  await Promise.all([
    writeJson(KEYS.cabinet, state.cabinet),
    writeJson(KEYS.logs, state.logs),
    writeJson(KEYS.catalog, state.catalog),
    writeJson(KEYS.rules, state.rules),
    writeJson(KEYS.reminders, state.reminders),
    writeJson(KEYS.onboarded, state.onboarded),
  ]);
}

export const persistCabinet = (v: SupplementItem[]) => writeJson(KEYS.cabinet, v);
export const persistLogs = (v: DailyLog[]) => writeJson(KEYS.logs, v);
export const persistCatalog = (v: CatalogEntry[]) => writeJson(KEYS.catalog, v);
export const persistRules = (v: RuleSettings) => writeJson(KEYS.rules, v);
export const persistReminders = (v: ReminderSettings) => writeJson(KEYS.reminders, v);
export const persistOnboarded = (v: boolean) => writeJson(KEYS.onboarded, v);

/** Wipes every local key — used by the "delete my data" control in Settings. */
export async function wipeAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
