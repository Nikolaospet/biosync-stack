import { useState } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { FREE_ITEM_LIMIT } from "@/store/entitlements";
import { useIsPro } from "@/store/purchases";
import { useStack } from "@/store/stack-store";
import { timeBlocks, type Category, type TimeOfDay } from "@/domain/supplements";
import { Button, Field, Row, Segmented, Sheet, Stack, Text, space, useToast } from "@/ui";

const categoryOptions: { value: Category; label: string }[] = [
  { value: "longevity", label: "Longevity" },
  { value: "sleep", label: "Sleep" },
  { value: "focus", label: "Focus" },
  { value: "recovery", label: "Recovery" },
  { value: "general", label: "General" },
];

const blockOptions = timeBlocks.map((b) => ({
  value: b.key,
  label: b.key.charAt(0).toUpperCase() + b.key.slice(1),
}));

export interface AddSupplementSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Manual add flow — the free-tier path into the cabinet. */
export function AddSupplementSheet({ open, onClose }: AddSupplementSheetProps) {
  const { addItem, items } = useStack();
  const isPro = useIsPro();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [pills, setPills] = useState("60");
  const [dose, setDose] = useState("1");
  const [time, setTime] = useState<TimeOfDay>("morning");
  const [category, setCategory] = useState<Category>("general");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setBrand("");
    setPills("60");
    setDose("1");
    setTime("morning");
    setCategory("general");
    setError(null);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the supplement a name.");
      return;
    }
    if (!isPro && items.length >= FREE_ITEM_LIMIT) {
      onClose();
      router.push("/paywall");
      return;
    }

    const total = Math.max(1, Number(pills) || 60);
    const daily = Math.min(6, Math.max(1, Number(dose) || 1));

    addItem({
      brand: brand.trim() || "Custom",
      name: trimmed,
      category,
      totalPills: total,
      remainingPills: total,
      dailyDose: daily,
      timeOfDay: time,
      expirationDate: new Date(Date.now() + 500 * 86400000).toISOString(),
      takenToday: false,
      takeWithFood: true,
      affiliateUrl: "",
      priceEstimate: 0,
    });

    toast.success(`${trimmed} added to your stack`);
    reset();
    onClose();
  };

  const remaining = FREE_ITEM_LIMIT - items.length;

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add supplement"
      footer={
        <View style={{ paddingBottom: space.md }}>
          <Button label="Add to stack" onPress={submit} fullWidth />
        </View>
      }
    >
      <Field
        label="Name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (error) setError(null);
        }}
        placeholder="Glycine 3g"
        autoCapitalize="words"
        returnKeyType="next"
        {...(error ? { error } : {})}
      />

      <Field
        label="Brand"
        value={brand}
        onChangeText={setBrand}
        placeholder="Thorne"
        autoCapitalize="words"
      />

      <Row gap={space.md} align="flex-start">
        <Field
          label="Pills per bottle"
          value={pills}
          onChangeText={setPills}
          keyboardType="number-pad"
          containerStyle={{ flex: 1 }}
        />
        <Field
          label="Pills per day"
          value={dose}
          onChangeText={setDose}
          keyboardType="number-pad"
          containerStyle={{ flex: 1 }}
        />
      </Row>

      <Stack gap={space.sm}>
        <Text variant="caption" tone="muted" weight="medium">
          Time block
        </Text>
        <Segmented options={blockOptions} value={time} onChange={setTime} label="Time block" />
      </Stack>

      <Stack gap={space.sm}>
        <Text variant="caption" tone="muted" weight="medium">
          Category
        </Text>
        <Segmented
          options={categoryOptions.slice(0, 3)}
          value={category}
          onChange={setCategory}
          tone="cyan"
          label="Category"
        />
        <Segmented
          options={categoryOptions.slice(3)}
          value={category}
          onChange={setCategory}
          tone="cyan"
          label="Category continued"
        />
      </Stack>

      {!isPro ? (
        <Text variant="micro" tone={remaining <= 2 ? "amber" : "muted"}>
          {remaining > 0
            ? `${remaining} of ${FREE_ITEM_LIMIT} free slots left.`
            : "Free cabinet is full — adding this opens BioSync Pro."}
        </Text>
      ) : null}
    </Sheet>
  );
}
