import Ionicons from "@expo/vector-icons/Ionicons";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/i18n";

/** Public privacy policy (required by Google Play to be reachable inside the app). */
export const PRIVACY_URL = "https://sokolink.co.tz/privacy";

/** Small "Privacy Policy" link; opens the policy page in an in-app browser. */
export function PrivacyLink({ note, style }: { note?: boolean; style?: ViewStyle }) {
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL).catch(() => {})}
      hitSlop={8}
      style={[styles.wrap, style]}
      accessibilityRole="link"
    >
      <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textMuted} />
      <Text style={styles.text}>
        {note ? `${t("privacyNote")} ` : ""}
        <Text style={styles.link}>{t("privacyPolicy")}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 6 },
  text: { flexShrink: 1, fontSize: 12, color: Colors.textMuted, textAlign: "center" },
  link: { color: Colors.primary, fontWeight: "800", textDecorationLine: "underline" },
});
