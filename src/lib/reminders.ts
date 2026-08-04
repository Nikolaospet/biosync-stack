import type { ReminderSettings } from "./db";
import { timeBlocks, type SupplementItem, type TimeOfDay } from "./supplements";

export type NotifyPermission = "unsupported" | "default" | "granted" | "denied";

/** Current browser notification permission, safe during SSR. */
export function notifyPermission(): NotifyPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifyPermission;
}

/** Asks the device for permission to show local dose reminders. */
export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (notifyPermission() === "unsupported") return "unsupported";
  try {
    return (await Notification.requestPermission()) as NotifyPermission;
  } catch {
    return "denied";
  }
}

/** Fires a local, on-device notification. No server or push service involved. */
export function fireLocalNotification(title: string, body: string, tag: string) {
  if (notifyPermission() !== "granted") return false;
  try {
    new Notification(title, { body, tag, icon: "/favicon.ico" });
    return true;
  } catch {
    return false;
  }
}

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
  return upcoming ?? pending[0];
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
    feed.push({
      id: `dose-${block.key}`,
      kind: "dose",
      title: `${block.label} · ${block.total - block.done} dose${
        block.total - block.done === 1 ? "" : "s"
      } left`,
      detail: block.complete
        ? "All logged — nice work."
        : `${block.items.map((i) => i.name).slice(0, 3).join(", ")}`,
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
