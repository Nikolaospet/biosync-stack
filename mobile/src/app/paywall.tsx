import { useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Sparkles, X } from "lucide-react-native";
import type { PurchasesPackage } from "react-native-purchases";

import { proBenefits } from "@/store/entitlements";
import { usePurchases } from "@/store/purchases";
import {
  Button,
  Card,
  IconButton,
  Row,
  Stack,
  Text,
  Touchable,
  alpha,
  colors,
  radius,
  space,
  useResponsive,
  useToast,
} from "@/ui";

const TERMS_URL = "https://alkelabs.com/biosync/terms";
const PRIVACY_URL = "https://alkelabs.com/biosync/privacy";

export default function PaywallScreen() {
  const { status, isPro, packages, purchase, restore, errorMessage, devSetPro } = usePurchases();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentWidth } = useResponsive();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected =
    packages.find((p) => p.identifier === selectedId) ?? packages[0] ?? null;

  const storeUnavailable = status !== "ready";

  const handlePurchase = async () => {
    if (!selected) return;
    setBusy(true);
    const result = await purchase(selected);
    setBusy(false);

    if (result === "purchased") {
      toast.success("Welcome to BioSync Pro");
      router.back();
    } else if (result === "failed") {
      toast.error("Purchase didn't complete", errorMessage ?? "Please try again.");
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const restored = await restore();
    setBusy(false);
    if (restored) {
      toast.success("Pro restored");
      router.back();
    } else {
      toast.info("No previous purchase found on this account");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={[styles.closeRow, { paddingHorizontal: gutter }]}>
        <IconButton icon={X} label="Close" variant="plain" onPress={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: gutter, paddingBottom: insets.bottom + space["3xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Sparkles size={24} color={colors.emerald} strokeWidth={2} />
            </View>
            <Text variant="display" center>
              BioSync Pro
            </Text>
            <Text variant="caption" tone="muted" center style={styles.heroCopy}>
              Your whole cabinet, the full interaction engine and scanning — all still evaluated
              entirely on your device.
            </Text>
          </View>

          <Stack gap={space.md} style={styles.benefits}>
            {proBenefits.map((benefit) => (
              <Row key={benefit} gap={space.md} align="flex-start">
                <View style={styles.tick}>
                  <Check size={13} color={colors.emerald} strokeWidth={3} />
                </View>
                <Text variant="caption" style={styles.benefitCopy}>
                  {benefit}
                </Text>
              </Row>
            ))}
          </Stack>

          {isPro ? (
            <Card tone="emerald" style={styles.state}>
              <Text variant="title" tone="emerald" center>
                Pro is active
              </Text>
              <Text variant="micro" tone="muted" center style={styles.stateCopy}>
                Everything is unlocked on this device. Manage or cancel any time in your store
                account.
              </Text>
            </Card>
          ) : storeUnavailable ? (
            <Card tone="amber" style={styles.state}>
              <Text variant="body" weight="semibold" tone="amber" center>
                {status === "unsupported-client"
                  ? "Purchases need a development build"
                  : status === "unconfigured"
                    ? "Store keys not configured"
                    : "Store unavailable"}
              </Text>
              <Text variant="micro" tone="muted" center style={styles.stateCopy}>
                {status === "unsupported-client"
                  ? "In-app purchases can't run inside Expo Go. Run a development or production build to test them."
                  : status === "unconfigured"
                    ? "Set EXPO_PUBLIC_RC_IOS_KEY and EXPO_PUBLIC_RC_ANDROID_KEY, then rebuild."
                    : (errorMessage ?? "Try again in a moment.")}
              </Text>
              {__DEV__ && devSetPro ? (
                <Button
                  label="Unlock Pro (dev only)"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onPress={() => {
                    devSetPro(true);
                    toast.info("Pro unlocked for this development session");
                    router.back();
                  }}
                  style={styles.devButton}
                />
              ) : null}
            </Card>
          ) : (
            <>
              <Stack gap={space.sm} style={styles.plans}>
                {packages.length === 0 ? (
                  <Card>
                    <Text variant="caption" tone="muted" center>
                      No subscription plans are available right now. Please try again later.
                    </Text>
                  </Card>
                ) : (
                  packages.map((pkg) => (
                    <PlanRow
                      key={pkg.identifier}
                      pkg={pkg}
                      selected={selected?.identifier === pkg.identifier}
                      onSelect={() => setSelectedId(pkg.identifier)}
                    />
                  ))
                )}
              </Stack>

              <Button
                label={selected ? "Start with Pro" : "Unavailable"}
                size="lg"
                fullWidth
                loading={busy}
                disabled={!selected}
                onPress={() => void handlePurchase()}
                style={styles.cta}
              />
              <Button
                label="Restore purchases"
                variant="ghost"
                fullWidth
                onPress={() => void handleRestore()}
                style={styles.restore}
              />
            </>
          )}

          <Text variant="micro" tone="muted" center style={styles.legal}>
            Subscriptions renew automatically until cancelled. Manage them in your App Store or
            Google Play account settings.
          </Text>
          <Row gap={space.lg} style={styles.legalLinks}>
            <Touchable
              haptic="none"
              onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}
              accessibilityLabel="Terms of use"
            >
              <Text variant="micro" tone="muted" style={styles.link}>
                Terms of use
              </Text>
            </Touchable>
            <Touchable
              haptic="none"
              onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
              accessibilityLabel="Privacy policy"
            >
              <Text variant="micro" tone="muted" style={styles.link}>
                Privacy policy
              </Text>
            </Touchable>
          </Row>
        </View>
      </ScrollView>
    </View>
  );
}

function PlanRow({
  pkg,
  selected,
  onSelect,
}: {
  pkg: PurchasesPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  const { product } = pkg;
  const title = product.title.replace(/\s*\(.*\)\s*$/, "");

  return (
    <Touchable
      onPress={onSelect}
      haptic="none"
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${product.priceString}`}
      style={[
        styles.plan,
        selected
          ? { borderColor: colors.emerald, backgroundColor: alpha(colors.emerald, 0.1) }
          : { borderColor: alpha(colors.border, 0.8) },
      ]}
    >
      <View style={styles.planCopy}>
        <Text variant="body" weight="semibold">
          {title}
        </Text>
        {product.description ? (
          <Text variant="micro" tone="muted" numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
      </View>
      <Text variant="body" weight="semibold" tone={selected ? "emerald" : "default"} tabular>
        {product.priceString}
      </Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  closeRow: { alignItems: "flex-end" },
  content: { paddingTop: space.sm },

  hero: { alignItems: "center", gap: space.sm, marginBottom: space["2xl"] },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(colors.emerald, 0.12),
    marginBottom: space.sm,
  },
  heroCopy: { maxWidth: 320 },

  benefits: { marginBottom: space["2xl"] },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(colors.emerald, 0.15),
  },
  benefitCopy: { flex: 1 },

  plans: { marginBottom: space.xl },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: 1.5,
    borderRadius: radius["2xl"],
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
  },
  planCopy: { flex: 1, gap: 2 },

  cta: { marginBottom: space.sm },
  restore: { marginBottom: space.lg },

  state: { marginBottom: space.xl },
  stateCopy: { marginTop: space.xs },
  devButton: { marginTop: space.lg },

  legal: { marginTop: space.sm },
  legalLinks: { justifyContent: "center", marginTop: space.md },
  link: { textDecorationLine: "underline" },
});
