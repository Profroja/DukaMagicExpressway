import { StyleSheet, useWindowDimensions, View } from "react-native";

import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/api";

const GAP = 12;
const PADDING = 16;

/** Two columns on phones, three on wide screens / tablets. */
export function ListingGrid({ items }: { items: Listing[] }) {
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width, 1000) - PADDING * 2 - GAP * (columns - 1)) / columns;
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <ListingCard key={item.id} item={item} width={cardWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
});
