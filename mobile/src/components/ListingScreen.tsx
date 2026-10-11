import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { ListingGrid } from "@/components/ListingGrid";
import { EmptyState, ErrorState, type IconName } from "@/components/ui";
import { Colors } from "@/constants/theme";
import type { Listing } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

/** Loads a list of listings and shows it as a refreshable grid. */
export function ListingScreen({
  load,
  emptyIcon,
  emptyTitle,
  header,
}: {
  load: () => Promise<Listing[]>;
  emptyIcon: IconName;
  emptyTitle: string;
  header?: string;
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = useCallback(async () => {
    try {
      setItems(await load());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [load]);

  // First load - state only changes once the response arrives.
  useEffect(() => {
    let alive = true;
    load()
      .then((data) => {
        if (!alive) return;
        setItems(data);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            run();
          }}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : failed ? (
        <ErrorState
          onRetry={() => {
            setLoading(true);
            run();
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} hint={t("nothingHere")} />
      ) : (
        <View>
          {!!header && (
            <Text style={styles.count}>
              {header} · {items.length}
            </Text>
          )}
          <ListingGrid items={items} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  count: { fontSize: 12, fontWeight: "700", color: Colors.textMuted, marginBottom: 12 },
});
