import { useCallback, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Barcode, Cpu, X } from "lucide-react-native";

import { parseExpirationText } from "@/domain/schedule";
import { unknownScanResult, type SupplementItem } from "@/domain/supplements";
import { useStack } from "@/store/stack-store";
import {
  Button,
  Card,
  Field,
  IconButton,
  Row,
  Stack,
  Text,
  alpha,
  colors,
  radius,
  space,
  useResponsive,
  useToast,
} from "@/ui";

/** Retail supplement bottles carry these symbologies. */
const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] as const;

interface ScanDraft {
  brand: string;
  name: string;
  totalPills: number;
  priceEstimate: number;
  expirationDate: string;
  barcode?: string;
  servingSize?: string;
  known: boolean;
}

export default function ScannerScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentWidth } = useResponsive();
  const { addItem, lookupBarcode, saveCatalogEntry } = useStack();

  const [permission, requestPermission] = useCameraPermissions();
  const [draft, setDraft] = useState<ScanDraft | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [expiry, setExpiry] = useState("");
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const locked = useRef(false);

  const buildDraft = useCallback(
    (code: string): ScanDraft => {
      const known = lookupBarcode(code);
      return {
        brand: known?.brand ?? unknownScanResult.brand,
        name: known?.name ?? unknownScanResult.name,
        totalPills: known?.totalPills ?? unknownScanResult.totalPills,
        priceEstimate: known?.priceEstimate ?? 0,
        expirationDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        barcode: code,
        ...(known?.servingSize ? { servingSize: known.servingSize } : {}),
        known: !!known,
      };
    },
    [lookupBarcode],
  );

  const onBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      // The camera fires continuously; latch on the first read until the user
      // dismisses the result, otherwise the sheet re-renders every frame.
      if (locked.current || !data) return;
      locked.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      setDraft(buildDraft(data.trim()));
    },
    [buildDraft],
  );

  const resetScan = () => {
    locked.current = false;
    setDraft(null);
    setExpiry("");
    setExpiryError(null);
  };

  const confirm = () => {
    if (!draft) return;

    let expirationDate = draft.expirationDate;
    if (expiry.trim()) {
      const parsed = parseExpirationText(expiry);
      if (!parsed) {
        setExpiryError("Try a format like 11/2027 or NOV 2027.");
        return;
      }
      expirationDate = parsed;
    }

    if (draft.barcode) {
      saveCatalogEntry({
        barcode: draft.barcode,
        brand: draft.brand,
        name: draft.name,
        totalPills: draft.totalPills,
        priceEstimate: draft.priceEstimate,
        ...(draft.servingSize ? { servingSize: draft.servingSize } : {}),
      });
    }

    const item: Omit<SupplementItem, "id"> = {
      brand: draft.brand,
      name: draft.name,
      category: "general",
      totalPills: draft.totalPills,
      remainingPills: draft.totalPills,
      dailyDose: 1,
      timeOfDay: "morning",
      expirationDate,
      takenToday: false,
      takeWithFood: true,
      affiliateUrl: "",
      priceEstimate: draft.priceEstimate,
      ...(draft.barcode ? { barcode: draft.barcode } : {}),
    };

    addItem(item);
    toast.success(`${draft.name} added to your cabinet`);
    router.back();
  };

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingHorizontal: gutter }]}>
        <Row style={styles.topBar}>
          <IconButton icon={X} label="Close scanner" variant="plain" onPress={() => router.back()} />
        </Row>
        <View style={styles.permissionWrap}>
          <Card tone="cyan">
            <Text variant="title">Camera access needed</Text>
            <Text variant="caption" tone="muted" style={styles.permissionCopy}>
              {permission.canAskAgain
                ? "BioSync reads the barcode directly on this device. No photo is stored or uploaded."
                : "Camera access is turned off for BioSync. Enable it in system settings to scan barcodes."}
            </Text>
            <Button
              label={permission.canAskAgain ? "Allow camera" : "Open settings"}
              fullWidth
              onPress={() => {
                if (permission.canAskAgain) void requestPermission();
                else void Linking.openSettings();
              }}
              style={styles.permissionCta}
            />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
          onBarcodeScanned={draft ? undefined : onBarcodeScanned}
        />
      </View>

      <View style={[styles.overlay, { paddingTop: insets.top + space.sm }]}>
        <View style={{ paddingHorizontal: gutter }}>
          <Row style={styles.topBar}>
            <Text variant="body" weight="semibold">
              Barcode scan
            </Text>
            <IconButton icon={X} label="Close scanner" variant="plain" onPress={() => router.back()} />
          </Row>
          <Row gap={space.xs}>
            <Cpu size={12} color={colors.emerald} strokeWidth={2.2} />
            <Text variant="micro" tone="muted">
              Decoded on this device — no image leaves your phone.
            </Text>
          </Row>
        </View>

        {!draft ? (
          <View style={styles.reticleWrap} pointerEvents="none">
            <View style={styles.reticle} />
            <Text variant="caption" tone="muted" center style={styles.hint}>
              Line the barcode up inside the frame
            </Text>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        <View
          style={[
            styles.sheet,
            {
              paddingHorizontal: gutter,
              paddingBottom: Math.max(insets.bottom, space.lg),
              maxWidth: contentWidth,
            },
          ]}
        >
          {draft ? (
            <Card tone="emerald">
              <Text variant="title" numberOfLines={2}>
                {draft.name}
              </Text>
              <Text variant="caption" tone="muted">
                {draft.brand} · {draft.barcode}
              </Text>
              <Text variant="micro" tone={draft.known ? "emerald" : "amber"} style={styles.matchNote}>
                {draft.known
                  ? "Matched from your local catalog."
                  : "New barcode — check the details before saving."}
              </Text>

              <Field
                label="Expiry date (optional)"
                value={expiry}
                onChangeText={(v) => {
                  setExpiry(v);
                  if (expiryError) setExpiryError(null);
                }}
                placeholder="11/2027"
                autoCapitalize="characters"
                containerStyle={styles.expiryField}
                {...(expiryError ? { error: expiryError } : {})}
              />

              <Row gap={space.sm} style={styles.draftActions}>
                <Button
                  label="Scan again"
                  variant="outline"
                  size="sm"
                  onPress={resetScan}
                  style={styles.flex}
                />
                <Button label="Add to cabinet" size="sm" onPress={confirm} style={styles.flex} />
              </Row>
            </Card>
          ) : (
            <Card>
              <Row gap={space.sm}>
                <Barcode size={16} color={colors.cyan} strokeWidth={2.2} />
                <Text variant="caption" weight="semibold">
                  Barcode won't scan?
                </Text>
              </Row>
              <Stack gap={space.sm} style={styles.manual}>
                <Field
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="Type the digits under the barcode"
                  keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const code = manualCode.trim();
                    if (code) {
                      locked.current = true;
                      setDraft(buildDraft(code));
                    }
                  }}
                />
                <Button
                  label="Look up"
                  variant="tonal"
                  tone="cyan"
                  size="sm"
                  fullWidth
                  disabled={!manualCode.trim()}
                  onPress={() => {
                    locked.current = true;
                    setDraft(buildDraft(manualCode.trim()));
                  }}
                />
              </Stack>
            </Card>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  overlay: { flex: 1, backgroundColor: alpha(colors.background, 0.55) },
  topBar: { justifyContent: "space-between", alignItems: "center" },

  reticleWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.lg },
  reticle: {
    width: "72%",
    aspectRatio: 1.6,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: alpha(colors.cyan, 0.7),
    borderRadius: radius["2xl"],
  },
  hint: { paddingHorizontal: space["2xl"] },
  spacer: { flex: 1 },

  sheet: { width: "100%", alignSelf: "center", paddingTop: space.md },
  matchNote: { marginTop: space.sm },
  expiryField: { marginTop: space.md },
  draftActions: { marginTop: space.lg },
  flex: { flex: 1 },
  manual: { marginTop: space.md },

  permissionWrap: { flex: 1, justifyContent: "center" },
  permissionCopy: { marginTop: space.xs },
  permissionCta: { marginTop: space.lg },
});
