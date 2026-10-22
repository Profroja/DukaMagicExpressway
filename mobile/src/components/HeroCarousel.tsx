import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, Radius, Shadow } from "@/constants/theme";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

/** Same pictures and words as the website's hero slides. */
const SLIDES: {
  image: number;
  title: TranslationKey;
  accent: TranslationKey;
  text: TranslationKey;
  badge: TranslationKey;
}[] = [
  {
    image: require("@/assets/images/banners/hero-rider.jpg"),
    title: "heroRiderTitle",
    accent: "heroRiderAccent",
    text: "heroRiderText",
    badge: "heroRiderBadge",
  },
  {
    image: require("@/assets/images/banners/hero-groceries.jpg"),
    title: "heroGroceriesTitle",
    accent: "heroGroceriesAccent",
    text: "heroGroceriesText",
    badge: "heroGroceriesBadge",
  },
  {
    image: require("@/assets/images/banners/hero-takeout.jpg"),
    title: "heroFoodTitle",
    accent: "heroFoodAccent",
    text: "heroFoodText",
    badge: "heroFoodBadge",
  },
];

const INTERVAL_MS = 4500;
const HEIGHT = 190;

/** Picture cards that slide by themselves; customers can also swipe them. */
export function HeroCarousel({ width }: { width: number }) {
  const { t } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const draggingRef = useRef(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (width <= 0) return;
    const timer = setInterval(() => {
      if (draggingRef.current) return;
      const next = (indexRef.current + 1) % SLIDES.length;
      indexRef.current = next;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [width]);

  return (
    <View style={[styles.wrap, { width }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => {
          draggingRef.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          draggingRef.current = false;
          const next = Math.round(e.nativeEvent.contentOffset.x / width);
          indexRef.current = next;
          setIndex(next);
        }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width, height: HEIGHT }}>
            <Image
              source={slide.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="right"
            />
            {/* Cream fade over the empty left side keeps the words easy to read. */}
            <LinearGradient
              colors={["rgba(253,248,238,0.97)", "rgba(253,248,238,0.8)", "rgba(253,248,238,0)"]}
              locations={[0, 0.45, 0.72]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.text}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                <Text style={styles.badgeText}>{t(slide.badge)}</Text>
              </View>
              <Text style={styles.title}>{t(slide.title)}</Text>
              <Text style={styles.accent}>{t(slide.accent)}</Text>
              <Text style={styles.body} numberOfLines={2}>
                {t(slide.text)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    marginBottom: 22,
    height: HEIGHT,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: "#FDF8EE",
    ...Shadow.raised,
  },
  text: { flex: 1, justifyContent: "center", paddingLeft: 16, paddingRight: "44%" },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  title: { color: Colors.navy, fontSize: 19, fontWeight: "900", lineHeight: 23 },
  accent: { marginTop: 2, color: Colors.primary, fontSize: 13, fontWeight: "900", lineHeight: 17 },
  body: { marginTop: 6, color: "#475569", fontSize: 10.5, lineHeight: 14, fontWeight: "600" },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(15,36,59,0.25)" },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});
