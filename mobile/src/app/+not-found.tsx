import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Compass } from "lucide-react-native";

import { Button, Card, Text, colors, space } from "@/ui";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <Card style={styles.card}>
        <Compass size={28} color={colors.emerald} strokeWidth={2} />
        <Text variant="headline" center style={styles.title}>
          Screen not found
        </Text>
        <Text variant="caption" tone="muted" center>
          That link doesn't point anywhere in BioSync Stack.
        </Text>
        <Button
          label="Back to today"
          fullWidth
          onPress={() => router.replace("/")}
          style={styles.cta}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
  },
  card: { alignItems: "center", width: "100%", maxWidth: 400, paddingVertical: space["3xl"] },
  title: { marginTop: space.lg },
  cta: { marginTop: space.xl },
});
