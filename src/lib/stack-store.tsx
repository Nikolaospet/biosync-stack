import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import {
  defaultReminderSettings,
  defaultRuleSettings,
  ensureSeeded,
  getDb,
  saveReminderSettings,
  saveRuleSettings,
  rolloverIfNewDay,
  todayKey,
  writeDailyLog,
  type CatalogEntry,
  type DailyLog,
  type ReminderSettings,
  type RuleSettings,
} from "./db";
import {
  initialSupplements,
  type Category,
  type SupplementItem,
  type TimeOfDay,
} from "./supplements";

interface StackContextValue {
  items: SupplementItem[];
  logs: DailyLog[];
  ready: boolean;
  toggleTaken: (id: string) => void;
  refill: (id: string) => void;
  remove: (id: string) => void;
  adjustDose: (id: string, delta: number) => void;
  addItem: (item: Omit<SupplementItem, "id">) => void;
  saveCatalogEntry: (entry: CatalogEntry) => void;
  lookupBarcode: (barcode: string) => Promise<CatalogEntry | undefined>;
  settings: RuleSettings;
  updateSettings: (patch: Partial<Omit<RuleSettings, "id">>) => void;
  resetSettings: () => void;
  reminders: ReminderSettings;
  updateReminders: (patch: Partial<Omit<ReminderSettings, "id">>) => void;
  resetReminders: () => void;
}

const StackContext = createContext<StackContextValue | null>(null);

async function mutate(id: string, fn: (item: SupplementItem) => SupplementItem) {
  const db = getDb();
  if (!db) return;
  const existing = await db.cabinet.get(id);
  if (!existing) return;
  await db.cabinet.put(fn(existing));
  await writeDailyLog();
}

export function StackProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void (async () => {
      await ensureSeeded();
      await rolloverIfNewDay();
      await writeDailyLog();
    })();
  }, []);

  const items = useLiveQuery(() => getDb()?.cabinet.toArray() ?? [], [], undefined);
  const logs = useLiveQuery(
    () => getDb()?.dailyLogs.orderBy("date").reverse().limit(14).toArray() ?? [],
    [],
    [] as DailyLog[],
  );

  const settings = useLiveQuery(
    () => getDb()?.ruleSettings.get("default") ?? undefined,
    [],
    undefined,
  );

  const reminders = useLiveQuery(
    () => getDb()?.reminders.get("default") ?? undefined,
    [],
    undefined,
  );

  const list = items ?? initialSupplements;

  const value = useMemo<StackContextValue>(
    () => ({
      items: list,
      logs: logs ?? [],
      ready: items !== undefined,
      toggleTaken: (id) =>
        void mutate(id, (i) => ({
          ...i,
          takenToday: !i.takenToday,
          remainingPills: Math.max(
            0,
            i.takenToday ? i.remainingPills + i.dailyDose : i.remainingPills - i.dailyDose,
          ),
        })),
      refill: (id) => void mutate(id, (i) => ({ ...i, remainingPills: i.totalPills })),
      remove: (id) =>
        void (async () => {
          await getDb()?.cabinet.delete(id);
          await writeDailyLog();
        })(),
      adjustDose: (id, delta) =>
        void mutate(id, (i) => ({
          ...i,
          dailyDose: Math.min(6, Math.max(1, i.dailyDose + delta)),
        })),
      addItem: (item) =>
        void (async () => {
          await getDb()?.cabinet.put({ ...item, id: `${Date.now()}` });
          await writeDailyLog();
        })(),
      saveCatalogEntry: (entry) => void getDb()?.customCatalog.put(entry),
      lookupBarcode: async (barcode) => getDb()?.customCatalog.get(barcode),
      settings: settings ?? defaultRuleSettings,
      updateSettings: (patch) => void saveRuleSettings(patch),
      resetSettings: () => void getDb()?.ruleSettings.put(defaultRuleSettings),
      reminders: reminders ?? defaultReminderSettings,
      updateReminders: (patch) => void saveReminderSettings(patch),
      resetReminders: () => void getDb()?.reminders.put(defaultReminderSettings),
    }),
    [list, logs, items, settings, reminders],
  );

  return <StackContext.Provider value={value}>{children}</StackContext.Provider>;
}

export function useStack() {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error("useStack must be used inside StackProvider");
  return ctx;
}

export function useStackStats() {
  const { items, logs } = useStack();
  return useMemo(() => {
    const taken = items.filter((i) => i.takenToday).length;
    const consistency = items.length ? Math.round((taken / items.length) * 100) : 0;
    const value = items.reduce((sum, i) => sum + i.priceEstimate, 0);
    const history = logs.filter((l) => l.date !== todayKey());
    const avgCompletion = history.length
      ? Math.round(history.reduce((s, l) => s + l.completionScore, 0) / history.length)
      : consistency;
    return { taken, total: items.length, consistency, value, avgCompletion };
  }, [items, logs]);
}

export const emptyDraft = (category: Category, timeOfDay: TimeOfDay) => ({
  category,
  timeOfDay,
});
