import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { buildBlockStatuses, parseTime } from "@/domain/schedule";
import type { ReminderSettings } from "@/domain/settings";
import { daysOfSupply, daysUntil, type SupplementItem } from "@/domain/supplements";

export type PermissionState = "granted" | "denied" | "undetermined" | "unsupported";

const DOSE_CHANNEL = "doses";
const CABINET_CHANNEL = "cabinet";

/** Digest hour for the low-stock / expiry summary. */
const DIGEST_HOUR = 18;

/**
 * Foreground presentation. Doses matter enough to interrupt, but they should
 * never make noise on their own — the sound is left to the OS notification
 * settings the user controls.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(DOSE_CHANNEL, {
    name: "Dose reminders",
    description: "Nudges when a scheduled supplement block is due.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: "#10B981",
  });
  await Notifications.setNotificationChannelAsync(CABINET_CHANNEL, {
    name: "Stock and expiry",
    description: "Low-stock nudges and expiry warnings for your cabinet.",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#F59E0B",
  });
}

export async function getPermissionState(): Promise<PermissionState> {
  if (!Device.isDevice) return "unsupported";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PermissionState;
  } catch {
    return "unsupported";
  }
}

/** Asks for permission, creating the Android channels first so they exist. */
export async function requestPermission(): Promise<PermissionState> {
  if (!Device.isDevice) return "unsupported";
  try {
    await ensureChannels();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    if (!current.canAskAgain) return "denied";

    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return status as PermissionState;
  } catch {
    return "unsupported";
  }
}

/**
 * Rebuilds the entire local schedule from the current cabinet and settings.
 *
 * Cancel-then-reschedule is deliberate: it is the only way to guarantee the
 * device schedule matches app state after edits, time changes or a restore,
 * and the notification count here is small (at most 5).
 */
export async function syncScheduledNotifications(
  items: SupplementItem[],
  settings: ReminderSettings,
): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const permission = await Notifications.getPermissionsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!permission.granted || !settings.enabled) return;

    await ensureChannels();

    for (const block of buildBlockStatuses(items, settings)) {
      if (!settings.blocks[block.key] || block.total === 0) continue;
      const { h, m } = parseTime(block.time);

      await Notifications.scheduleNotificationAsync({
        identifier: `dose-${block.key}`,
        content: {
          title: `${block.label} is due`,
          body:
            block.total === 1
              ? `${block.items[0]?.name ?? "1 supplement"} is waiting.`
              : `${block.total} supplements are waiting in this block.`,
          data: { kind: "dose", block: block.key },
          ...(Platform.OS === "android" ? { channelId: DOSE_CHANNEL } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
    }

    const lowStock = settings.lowStockAlerts
      ? items.filter((i) => daysOfSupply(i) <= settings.lowStockDays)
      : [];
    const expiring = settings.expiryAlerts
      ? items.filter((i) => daysUntil(i.expirationDate) <= settings.expiryLeadDays)
      : [];

    if (lowStock.length || expiring.length) {
      await Notifications.scheduleNotificationAsync({
        identifier: "cabinet-digest",
        content: {
          title: "Your cabinet needs attention",
          body: buildDigestBody(lowStock.length, expiring.length),
          data: { kind: "cabinet" },
          ...(Platform.OS === "android" ? { channelId: CABINET_CHANNEL } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: DIGEST_HOUR,
          minute: 0,
        },
      });
    }
  } catch {
    // Scheduling is best-effort; the in-app reminder feed remains the source
    // of truth and stays correct even when the OS refuses to schedule.
  }
}

function buildDigestBody(lowStock: number, expiring: number) {
  const parts: string[] = [];
  if (lowStock) parts.push(`${lowStock} running low`);
  if (expiring) parts.push(`${expiring} expiring soon`);
  return `${parts.join(" · ")}. Tap to review and reorder.`;
}

export async function cancelAll() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing to clean up.
  }
}
