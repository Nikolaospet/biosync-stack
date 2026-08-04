import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { useStack } from "@/store/stack-store";
import {
  getPermissionState,
  requestPermission,
  syncScheduledNotifications,
  type PermissionState,
} from "./scheduler";

/** Debounce so rapid dose toggles do not thrash the OS scheduler. */
const SYNC_DELAY_MS = 1200;

/**
 * Keeps the device notification schedule in step with the cabinet and the
 * user's reminder settings, and exposes the permission state to the UI.
 */
export function useNotifications() {
  const { items, reminders, ready } = useStack();
  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getPermissionState().then(setPermission);
  }, []);

  // The user can flip notification permission in system settings while the app
  // is backgrounded, so re-read it every time we come back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void getPermissionState().then(setPermission);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready || permission !== "granted") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void syncScheduledNotifications(items, reminders);
    }, SYNC_DELAY_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ready, permission, items, reminders]);

  const enable = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") await syncScheduledNotifications(items, reminders);
    return result;
  }, [items, reminders]);

  return { permission, enable };
}
