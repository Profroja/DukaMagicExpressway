import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/i18n";
import { useStaff } from "@/lib/staff";

/** Brand bar at the top of each tab, with the EN / SW switch. */
export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const { t, language, toggle } = useLanguage();
  const { session } = useStaff();
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
              SokoLink
            </Text>
            <Text style={styles.subtitle}>{t("tagline")}</Text>
          </>
        )}
      </View>
      {/* Staff sign in (or back to the staff screens when signed in) */}
      <Pressable
        onPress={() => router.push(session ? "/staff" : "/staff/login")}
        hitSlop={8}
        style={styles.staff}
        accessibilityRole="button"
        accessibilityLabel={t("staffLogin")}
      >
        <Ionicons name={session ? "person" : "person-outline"} size={18} color="#FFFFFF" />
      </Pressable>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={styles.lang}
        accessibilityRole="button"
        accessibilityLabel={t("language")}
      >
        <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
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
    paddingBottom: 16,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  brand: { fontSize: 20, fontWeight: "900", color: "#FFFFFF" },
  title: { fontSize: 21, fontWeight: "900", color: "#FFFFFF" },
  subtitle: { fontSize: 11.5, fontWeight: "600", color: "rgba(255,255,255,0.85)", marginTop: 1 },
  lang: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  langText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  staff: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
