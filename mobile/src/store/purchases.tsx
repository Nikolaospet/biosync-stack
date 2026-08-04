import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import { PRO_ENTITLEMENT } from "./entitlements";

/**
 * Why the store might not be usable. Screens surface this so a user is never
 * shown a Buy button that cannot possibly work.
 */
export type StoreStatus =
  | "ready"
  | "loading"
  | "unconfigured"
  | "unsupported-client"
  | "error";

interface PurchasesContextValue {
  status: StoreStatus;
  isPro: boolean;
  /** True once the entitlement state is known, whatever that state is. */
  ready: boolean;
  offering: PurchasesOffering | null;
  packages: PurchasesPackage[];
  errorMessage: string | null;
  purchase: (pkg: PurchasesPackage) => Promise<"purchased" | "cancelled" | "failed">;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
  /** Development-only entitlement override. Compiled out of release builds. */
  devSetPro: ((next: boolean) => void) | null;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  default: undefined,
});

/**
 * react-native-purchases is a native module, so it cannot run inside Expo Go.
 * Detecting this up front turns a hard native crash into a clear message.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function hasProEntitlement(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[PRO_ENTITLEMENT];
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StoreStatus>("loading");
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devPro, setDevPro] = useState(false);

  const loadOfferings = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current ?? null);
    } catch (error) {
      // Missing offerings should not block the app — the paywall simply shows
      // an unavailable state instead of an empty product list.
      setErrorMessage(error instanceof Error ? error.message : "Could not load products");
    }
  }, []);

  useEffect(() => {
    if (isExpoGo) {
      setStatus("unsupported-client");
      return;
    }
    if (!API_KEY) {
      setStatus("unconfigured");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
        await Purchases.configure({ apiKey: API_KEY });

        const info = await Purchases.getCustomerInfo();
        if (cancelled) return;
        setIsPro(hasProEntitlement(info));
        await loadOfferings();
        if (cancelled) return;
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "Store unavailable");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadOfferings]);

  // Keeps entitlement state correct after a renewal, a refund or a purchase
  // made on another device with the same store account.
  useEffect(() => {
    if (status !== "ready") return;
    const listener = (info: CustomerInfo) => setIsPro(hasProEntitlement(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [status]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<"purchased" | "cancelled" | "failed"> => {
      if (status !== "ready") return "failed";
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const unlocked = hasProEntitlement(customerInfo);
        setIsPro(unlocked);
        return unlocked ? "purchased" : "failed";
      } catch (error) {
        const cancelled =
          typeof error === "object" && error !== null && "userCancelled" in error
            ? Boolean((error as { userCancelled?: boolean }).userCancelled)
            : false;
        if (cancelled) return "cancelled";
        setErrorMessage(error instanceof Error ? error.message : "Purchase failed");
        return "failed";
      }
    },
    [status],
  );

  const restore = useCallback(async () => {
    if (status !== "ready") return false;
    try {
      const info = await Purchases.restorePurchases();
      const unlocked = hasProEntitlement(info);
      setIsPro(unlocked);
      return unlocked;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Restore failed");
      return false;
    }
  }, [status]);

  const refresh = useCallback(async () => {
    if (status !== "ready") return;
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPro(hasProEntitlement(info));
      await loadOfferings();
    } catch {
      // A refresh failure leaves the last known entitlement in place.
    }
  }, [status, loadOfferings]);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      status,
      isPro: isPro || (__DEV__ && devPro),
      ready: status !== "loading",
      offering,
      packages: offering?.availablePackages ?? [],
      errorMessage,
      purchase,
      restore,
      refresh,
      devSetPro: __DEV__ ? setDevPro : null,
    }),
    [status, isPro, devPro, offering, errorMessage, purchase, restore, refresh],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error("usePurchases must be used inside PurchasesProvider");
  return ctx;
}

/** Convenience hook for the common "is this gated?" question. */
export function useIsPro() {
  return usePurchases().isPro;
}
