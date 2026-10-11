import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/i18n";

/** Brand bar at the top of each tab, with the EN / SW switch. */
export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const { t, language, toggle } = useLanguage();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <BrandLogo size={38} />
      <View style={{ flex: 1 }}>
        {title ? (
          <>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </>
        ) : (
          <>
            <Text style={styles.brand}>
              Duka Magic <Text style={{ color: Colors.primary }}>Expressway</Text>
            </Text>
            <Text style={styles.subtitle}>{t("tagline")}</Text>
          </>
        )}
      </View>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={styles.lang}
        accessibilityRole="button"
        accessibilityLabel={t("language")}
      >
        <Ionicons name="globe-outline" size={14} color={Colors.navy} />
        <Text style={styles.langText}>{language === "en" ? "EN" : "SW"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  brand: { fontSize: 17, fontWeight: "900", color: Colors.navy },
  title: { fontSize: 19, fontWeight: "900", color: Colors.navy },
  subtitle: { fontSize: 11, fontWeight: "600", color: Colors.textMuted, marginTop: 1 },
  lang: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  langText: { fontSize: 12, fontWeight: "900", color: Colors.navy },
});
