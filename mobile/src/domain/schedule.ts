import type { ReminderSettings } from "./settings";
import { timeBlocks, type SupplementItem, type TimeOfDay } from "./supplements";

export function parseTime(value: string) {
  const [h, m] = value.split(":");
  return { h: Number(h) || 0, m: Number(m) || 0 };
}

export function minutesOfDay(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatTime(value: string) {
  const { h, m } = parseTime(value);
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatRelative(minutes: number) {
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

/** Clamps arbitrary user text to a valid "HH:MM" 24h string. */
export function clampTime(h: number, m: number) {
  const hh = Math.min(23, Math.max(0, Math.round(h)));
  const mm = Math.min(59, Math.max(0, Math.round(m)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export interface BlockStatus {
  key: TimeOfDay;
  label: string;
  window: string;
  time: string;
  minutes: number;
  items: SupplementItem[];
  done: number;
  total: number;
  complete: boolean;
  due: boolean;
}

/** Groups the cabinet into scheduled blocks with reminder times attached. */
export function buildBlockStatuses(
  items: SupplementItem[],
  settings: ReminderSettings,
  now = new Date(),
): BlockStatus[] {
  const nowMinutes = minutesOfDay(now);
  return timeBlocks.map((block) => {
    const blockItems = items.filter((i) => i.timeOfDay === block.key);
    const done = blockItems.filter((i) => i.takenToday).length;
    const time = settings.times[block.key];
    const { h, m } = parseTime(time);
    const minutes = h * 60 + m;
    return {
      key: block.key,
      label: block.label,
      window: block.window,
      time,
      minutes,
      items: blockItems,
      done,
      total: blockItems.length,
      complete: blockItems.length > 0 && done === blockItems.length,
      due: nowMinutes >= minutes,
    };
  });
}

/** The block the user should act on next: earliest incomplete block. */
export function nextBlock(statuses: BlockStatus[], now = new Date()) {
  const nowMinutes = minutesOfDay(now);
  const pending = statuses.filter((b) => b.total > 0 && !b.complete);
  if (pending.length === 0) return null;
  const upcoming = pending.find((b) => b.minutes >= nowMinutes);
  return upcoming ?? pending[0] ?? null;
}

export interface ReminderFeedItem {
  id: string;
  kind: "dose" | "stock" | "expiry";
  title: string;
  detail: string;
  when: string;
  tone: "emerald" | "cyan" | "amber" | "crimson";
}

/** Builds the reminder feed shown on the Reminders screen. */
export function buildReminderFeed(
  items: SupplementItem[],
  settings: ReminderSettings,
  now = new Date(),
): ReminderFeedItem[] {
  const feed: ReminderFeedItem[] = [];
  const nowMinutes = minutesOfDay(now);

  for (const block of buildBlockStatuses(items, settings, now)) {
    if (!settings.blocks[block.key] || block.total === 0) continue;
    const delta = block.minutes - nowMinutes;
    const left = block.total - block.done;
    feed.push({
      id: `dose-${block.key}`,
      kind: "dose",
      title: `${block.label} · ${left} dose${left === 1 ? "" : "s"} left`,
      detail: block.complete
        ? "All logged — nice work."
        : block.items
            .filter((i) => !i.takenToday)
            .map((i) => i.name)
            .slice(0, 3)
            .join(", "),
      when: block.complete
        ? "Done today"
        : delta >= 0
          ? `${formatTime(block.time)} · ${formatRelative(delta)}`
          : `${formatTime(block.time)} · overdue`,
      tone: block.complete ? "emerald" : delta < 0 ? "amber" : "cyan",
    });
  }

  if (settings.lowStockAlerts) {
    for (const item of items) {
      const days = Math.floor(item.remainingPills / Math.max(item.dailyDose, 1));
      if (days <= settings.lowStockDays) {
        feed.push({
          id: `stock-${item.id}`,
          kind: "stock",
          title: `${item.name} is running low`,
          detail: `${item.remainingPills} pills left · ${days} day${days === 1 ? "" : "s"} of supply`,
          when: days <= 2 ? "Reorder today" : "Reorder this week",
          tone: days <= 2 ? "crimson" : "amber",
        });
      }
    }
  }

  if (settings.expiryAlerts) {
    for (const item of items) {
      const days = Math.round(
        (new Date(item.expirationDate).getTime() - now.getTime()) / 86400000,
      );
      if (days <= settings.expiryLeadDays) {
        feed.push({
          id: `expiry-${item.id}`,
          kind: "expiry",
          title: days < 0 ? `${item.name} has expired` : `${item.name} expires soon`,
          detail:
            days < 0
              ? "Remove it from your cabinet."
              : `${days} day${days === 1 ? "" : "s"} of shelf life left`,
          when: new Date(item.expirationDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          tone: days < 0 ? "crimson" : "amber",
        });
      }
    }
  }

  return feed;
}

/** Parses printed expiry text such as "EXP 11/2027" or "2027-11-01" into an ISO date. */
export function parseExpirationText(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  if (!text) return null;

  const isoMatch = text.match(/(20\d{2})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const mo = Number(isoMatch[2]);
    const d = Number(isoMatch[3] ?? 1);
    if (mo >= 1 && mo <= 12) return endOfDay(y, mo, d);
  }

  const mmYyyy = text.match(/(\d{1,2})[-/.](20\d{2})/);
  if (mmYyyy) {
    const mo = Number(mmYyyy[1]);
    const y = Number(mmYyyy[2]);
    if (mo >= 1 && mo <= 12) return endOfDay(y, mo, lastDayOfMonth(y, mo));
  }

  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const named = text.match(/([A-Z]{3})[A-Z]*\s*[-/.]?\s*(20\d{2}|\d{2})/);
  if (named) {
    const idx = months.indexOf(named[1] ?? "");
    if (idx >= 0) {
      const rawYear = named[2] ?? "";
      const y = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
      return endOfDay(y, idx + 1, lastDayOfMonth(y, idx + 1));
    }
  }

  return null;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function endOfDay(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 23, 59, 59).toISOString();
}
