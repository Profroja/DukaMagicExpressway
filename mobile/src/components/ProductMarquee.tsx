import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/api";

const CARD_WIDTH = 150;
const GAP = 12;
const PX_PER_SECOND = 28;

/**
 * Products on two rows sliding sideways in opposite directions, like the
 * website's Popular Products. Each row repeats its items so the loop never
 * shows a gap; tapping a card opens it.
 */
export function ProductMarquee({ items }: { items: Listing[] }) {
  if (items.length === 0) return null;
  // One row for a handful of products, two once there are enough.
  const rows = items.length >= 6 ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : [items];
  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, i) => (
        <MarqueeRow key={i} items={row} reverse={i === 1} />
      ))}
    </View>
  );
}

function MarqueeRow({ items, reverse }: { items: Listing[]; reverse: boolean }) {
  // Repeat short rows so one copy is wider than the screen, then show it twice.
  const copies = Math.max(1, Math.ceil(6 / items.length));
  const base = Array.from({ length: copies }, () => items).flat();
  const span = base.length * (CARD_WIDTH + GAP);
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    offset.setValue(reverse ? -span : 0);
    const loop = Animated.loop(
      Animated.timing(offset, {
        toValue: reverse ? 0 : -span,
        duration: (span / PX_PER_SECOND) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [offset, span, reverse]);

  return (
    <View style={styles.viewport}>
      <Animated.View style={[styles.track, { transform: [{ translateX: offset }] }]}>
        {[...base, ...base].map((item, i) => (
          <ListingCard key={`${item.id}-${i}`} item={item} width={CARD_WIDTH} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { overflow: "hidden", marginHorizontal: -16, paddingHorizontal: 16 },
  track: { flexDirection: "row", gap: GAP },
});
