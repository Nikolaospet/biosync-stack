import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import {
  defaultReminderSettings,
  defaultRuleSettings,
  todayKey,
  type CatalogEntry,
  type DailyLog,
  type ReminderSettings,
  type RuleSettings,
} from "@/domain/settings";
import type { SupplementItem } from "@/domain/supplements";
import {
  loadState,
  persistCabinet,
  persistCatalog,
  persistLogs,
  persistOnboarded,
  persistReminders,
  persistRules,
  wipeAll,
} from "./persistence";

interface StackContextValue {
  ready: boolean;
  items: SupplementItem[];
  logs: DailyLog[];
  settings: RuleSettings;
  reminders: ReminderSettings;
  onboarded: boolean;

  toggleTaken: (id: string) => void;
  refill: (id: string) => void;
  remove: (id: string) => void;
  adjustDose: (id: string, delta: number) => void;
  addItem: (item: Omit<SupplementItem, "id">) => SupplementItem;
  updateItem: (id: string, patch: Partial<Omit<SupplementItem, "id">>) => void;
  logBlock: (ids: string[]) => number;

  saveCatalogEntry: (entry: CatalogEntry) => void;
  lookupBarcode: (barcode: string) => CatalogEntry | undefined;

  updateSettings: (patch: Partial<RuleSettings>) => void;
  resetSettings: () => void;
  updateReminders: (patch: Partial<ReminderSettings>) => void;
  resetReminders: () => void;
  completeOnboarding: () => void;
  resetEverything: () => Promise<void>;
}

const StackContext = createContext<StackContextValue | null>(null);

/** Recomputes today's completion score from the live cabinet. */
function buildLog(items: SupplementItem[]): DailyLog {
  const takenItems = items.filter((i) => i.takenToday).map((i) => i.id);
  return {
    date: todayKey(),
    takenItems,
    completionScore: items.length
      ? Math.round((takenItems.length / items.length) * 100)
      : 0,
  };
}

/** Keeps at most 60 days of history so storage stays bounded. */
function upsertLog(logs: DailyLog[], next: DailyLog): DailyLog[] {
  const rest = logs.filter((l) => l.date !== next.date);
  return [next, ...rest].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
}

export function StackProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<SupplementItem[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [settings, setSettings] = useState<RuleSettings>(defaultRuleSettings);
  const [reminders, setReminders] = useState<ReminderSettings>(defaultReminderSettings);
  const [onboarded, setOnboarded] = useState(false);

  const dayRef = useRef(todayKey());
  // Mirrors of the latest state so the AppState listener can read current
  // values without re-subscribing on every cabinet change.
  const itemsRef = useRef<SupplementItem[]>([]);
  const logsRef = useRef<DailyLog[]>([]);
  itemsRef.current = items;
  logsRef.current = logs;

  /**
   * Closes out the previous day and clears takenToday when the device date has
   * moved on. Pure: returns the next slices, the caller commits them.
   */
  const rollover = useCallback((cabinet: SupplementItem[], history: DailyLog[]) => {
    const key = todayKey();
    dayRef.current = key;
    if (history.some((l) => l.date === key)) return { cabinet, logs: history, changed: false };

    const closed = cabinet.some((i) => i.takenToday)
      ? upsertLog(history, buildLog(cabinet))
      : history;
    const reset = cabinet.map((i) => (i.takenToday ? { ...i, takenToday: false } : i));
    const withToday = upsertLog(closed, { date: key, takenItems: [], completionScore: 0 });
    return { cabinet: reset, logs: withToday, changed: true };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const state = await loadState();
      if (cancelled) return;

      // Roll the day over before first paint so a stale "taken" tick from
      // yesterday never shows as today's progress.
      const rolled = rollover(state.cabinet, state.logs);
      if (rolled.changed) {
        void persistCabinet(rolled.cabinet);
        void persistLogs(rolled.logs);
      }
      setItems(rolled.cabinet);
      setLogs(rolled.logs);
      setCatalog(state.catalog);
      setSettings(state.rules);
      setReminders(state.reminders);
      setOnboarded(state.onboarded);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [rollover]);

  // Re-check the date whenever the app returns to the foreground; phones sit
  // backgrounded across midnight far more often than a web tab does.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active" || dayRef.current === todayKey()) return;
      const rolled = rollover(itemsRef.current, logsRef.current);
      if (!rolled.changed) return;
      void persistCabinet(rolled.cabinet);
      void persistLogs(rolled.logs);
      setItems(rolled.cabinet);
      setLogs(rolled.logs);
    });
    return () => sub.remove();
  }, [rollover]);

  /** Applies a cabinet change, persists it and refreshes today's log. */
  const commit = useCallback((next: SupplementItem[]) => {
    const merged = upsertLog(logsRef.current, buildLog(next));
    itemsRef.current = next;
    logsRef.current = merged;
    setItems(next);
    setLogs(merged);
    void persistCabinet(next);
    void persistLogs(merged);
  }, []);

  const mutate = useCallback(
    (id: string, fn: (item: SupplementItem) => SupplementItem) => {
      commit(itemsRef.current.map((i) => (i.id === id ? fn(i) : i)));
    },
    [commit],
  );

  const value = useMemo<StackContextValue>(() => {
    const takeOne = (i: SupplementItem): SupplementItem => ({
      ...i,
      takenToday: !i.takenToday,
      remainingPills: Math.max(
        0,
        i.takenToday ? i.remainingPills + i.dailyDose : i.remainingPills - i.dailyDose,
      ),
    });

    return {
      ready,
      items,
      logs,
      settings,
      reminders,
      onboarded,

      toggleTaken: (id) => mutate(id, takeOne),
      refill: (id) => mutate(id, (i) => ({ ...i, remainingPills: i.totalPills })),
      adjustDose: (id, delta) =>
        mutate(id, (i) => ({
          ...i,
          dailyDose: Math.min(6, Math.max(1, i.dailyDose + delta)),
        })),
      updateItem: (id, patch) => mutate(id, (i) => ({ ...i, ...patch })),
      remove: (id) => commit(items.filter((i) => i.id !== id)),

      addItem: (item) => {
        const created: SupplementItem = {
          ...item,
          id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        };
        commit([...items, created]);
        return created;
      },

      /** Marks every listed dose taken in one pass. Returns how many changed. */
      logBlock: (ids) => {
        const pending = new Set(
          items.filter((i) => ids.includes(i.id) && !i.takenToday).map((i) => i.id),
        );
        if (pending.size === 0) return 0;
        commit(items.map((i) => (pending.has(i.id) ? takeOne(i) : i)));
        return pending.size;
      },

      saveCatalogEntry: (entry) =>
        setCatalog((prev) => {
          const next = [entry, ...prev.filter((c) => c.barcode !== entry.barcode)].slice(0, 500);
          void persistCatalog(next);
          return next;
        }),
      lookupBarcode: (barcode) => catalog.find((c) => c.barcode === barcode),

      updateSettings: (patch) =>
        setSettings((prev) => {
          const next = { ...prev, ...patch };
          void persistRules(next);
          return next;
        }),
      resetSettings: () => {
        setSettings(defaultRuleSettings);
        void persistRules(defaultRuleSettings);
      },

      updateReminders: (patch) =>
        setReminders((prev) => {
          const next: ReminderSettings = {
            ...prev,
            ...patch,
            times: { ...prev.times, ...(patch.times ?? {}) },
            blocks: { ...prev.blocks, ...(patch.blocks ?? {}) },
          };
          void persistReminders(next);
          return next;
        }),
      resetReminders: () => {
        setReminders(defaultReminderSettings);
        void persistReminders(defaultReminderSettings);
      },

      completeOnboarding: () => {
        setOnboarded(true);
        void persistOnboarded(true);
      },

      resetEverything: async () => {
        await wipeAll();
        const fresh = await loadState();
        setItems(fresh.cabinet);
        setLogs(fresh.logs);
        setCatalog(fresh.catalog);
        setSettings(fresh.rules);
        setReminders(fresh.reminders);
        setOnboarded(false);
      },
    };
  }, [ready, items, logs, catalog, settings, reminders, onboarded, commit, mutate]);

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
    const streak = currentStreak(logs);
    return { taken, total: items.length, consistency, value, avgCompletion, streak };
  }, [items, logs]);
}

/** Consecutive days ending yesterday where every scheduled dose was logged. */
function currentStreak(logs: DailyLog[]) {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  let streak = 0;
  const cursor = new Date();
  // Today is still in progress, so the streak is measured from yesterday back.
  cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const log = byDate.get(todayKey(cursor));
    if (!log || log.completionScore < 100) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
