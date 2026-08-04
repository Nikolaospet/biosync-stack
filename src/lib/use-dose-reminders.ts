import { useEffect, useRef } from "react";

import { useStack } from "./stack-store";
import {
  buildBlockStatuses,
  fireLocalNotification,
  minutesOfDay,
  notifyPermission,
} from "./reminders";
import { todayKey } from "./db";

/**
 * Checks every minute whether a scheduled block is due and fires a local
 * on-device notification once per block per day. No network involved.
 */
export function useDoseReminders() {
  const { items, reminders } = useStack();
  const fired = useRef<Set<string>>(new Set());
  const state = useRef({ items, reminders });
  state.current = { items, reminders };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      const { items: list, reminders: settings } = state.current;
      if (!settings.enabled || notifyPermission() !== "granted") return;
      const now = new Date();
      const nowMinutes = minutesOfDay(now);
      for (const block of buildBlockStatuses(list, settings, now)) {
        const key = `${todayKey(now)}-${block.key}`;
        if (
          settings.blocks[block.key] &&
          block.total > 0 &&
          !block.complete &&
          nowMinutes >= block.minutes &&
          nowMinutes - block.minutes < 60 &&
          !fired.current.has(key)
        ) {
          fired.current.add(key);
          fireLocalNotification(
            `${block.label} time`,
            `${block.total - block.done} dose${
              block.total - block.done === 1 ? "" : "s"
            } waiting in BioStack.`,
            key,
          );
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
}
