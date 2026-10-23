import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/i18n";
import { useStaff } from "@/lib/staff";

/** Orange home header: logo + name, staff / language buttons, and the search bar. */
export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { t, language, toggle } = useLanguage();
  const { session } = useStaff();
  const [query, setQuery] = useState("");

  const search = () => {
    const q = query.trim();
    if (q) router.push({ pathname: "/search", params: { q } });
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="cover" />
        </View>
        <Text style={styles.brand}>SokoLink</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.push(session ? "/staff" : "/staff/login")}
          hitSlop={8}
          style={styles.iconButton}
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

      <View style={styles.search}>
        <Ionicons name="search" size={19} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={Colors.textFaint}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={search} style={styles.searchGo} hitSlop={6}>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 3,
  },
  logo: { width: "100%", height: "100%", borderRadius: 9 },
  brand: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 0.2 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  lang: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  langText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  search: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInput: { flex: 1, fontSize: 14.5, color: Colors.text, fontWeight: "500" },
  searchGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
