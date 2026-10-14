import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ErrorState } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { fetchCategories, type CategoryLists } from "@/lib/api";
import { categoryStyle, legacyKey } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";

/** Every goods and service category, searchable. */
export default function CategoriesScreen() {
  const { t } = useLanguage();
  const [lists, setLists] = useState<CategoryLists | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  const load = () =>
    fetchCategories()
      .then((data) => {
        setLists(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));

  useEffect(() => {
    load();
  }, []);

  const label = (name: string) => {
    const key = legacyKey(name);
    return key ? t(key) : name;
  };
  const term = query.trim().toLowerCase();
  const groups = (["goods", "services"] as const).map((kind) => ({
    kind,
    items: (lists?.[kind] ?? []).filter((c) => !term || label(c.name).toLowerCase().includes(term)),
  }));

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t("allCategories") }} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchCategories")}
          placeholderTextColor={Colors.textFaint}
          style={styles.search}
          returnKeyType="search"
        />
      </View>

      {failed ? (
        <ErrorState onRetry={load} />
      ) : !lists ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {groups.map(
            (group) =>
              group.items.length > 0 && (
                <View key={group.kind} style={{ marginBottom: 20 }}>
                  <Text style={styles.groupTitle}>
                    {group.kind === "goods" ? t("goods") : t("services")}
                  </Text>
                  {group.items.map((c, i) => {
                    const style = categoryStyle(c.name, i, group.kind);
                    return (
                      <Pressable
                        key={c.name}
                        onPress={() =>
                          router.push({ pathname: "/category/[index]", params: { index: c.name } })
                        }
                        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                      >
                        <View style={[styles.icon, { backgroundColor: `${style.color}14` }]}>
                          <Ionicons name={style.icon} size={18} color={style.color} />
                        </View>
                        <Text style={styles.name}>{label(c.name)}</Text>
                        {c.count > 0 && <Text style={styles.count}>{c.count}</Text>}
                        <Ionicons name="chevron-forward" size={16} color={Colors.textFaint} />
                      </Pressable>
                    );
                  })}
                </View>
              ),
          )}
          {groups.every((g) => g.items.length === 0) && (
            <Text style={styles.empty}>{t("noCategoryMatch")}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 0,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
  },
  search: { flex: 1, fontSize: 15, color: Colors.text },
  groupTitle: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "900",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: Radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  name: { flex: 1, fontSize: 14, fontWeight: "700", color: Colors.navy },
  count: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  empty: { marginTop: 30, textAlign: "center", color: Colors.textMuted },
});
