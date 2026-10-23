import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, Shadow } from "@/constants/theme";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

/** Picture slides (same pictures as the website); each has a "Shop Now" button. */
const SLIDES: {
  image: number;
  title: TranslationKey;
  accent: TranslationKey;
  /** Category "Shop Now" opens; none = all categories. */
  target?: string;
}[] = [
  {
    image: require("@/assets/images/banners/hero-rider.jpg"),
    title: "heroRiderTitle",
    accent: "heroRiderAccent",
  },
  {
    image: require("@/assets/images/banners/hero-shop.jpg"),
    title: "heroShopTitle",
    accent: "heroShopAccent",
  },
  {
    image: require("@/assets/images/banners/hero-groceries.jpg"),
    title: "heroGroceriesTitle",
    accent: "heroGroceriesAccent",
    target: "Groceries",
  },
  {
    image: require("@/assets/images/banners/hero-takeout.jpg"),
    title: "heroFoodTitle",
    accent: "heroFoodAccent",
    target: "Food & Drinks",
  },
];

const INTERVAL_MS = 4500;
const HEIGHT = 178;

/** Rounded picture cards that slide by themselves; customers can also swipe them. */
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

  const open = (target?: string) =>
    target
      ? router.push({ pathname: "/category/[index]", params: { index: target } })
      : router.push("/categories");

  return (
    <View style={{ marginTop: 18 }}>
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
              <LinearGradient
                colors={["rgba(17,24,39,0.92)", "rgba(17,24,39,0.7)", "rgba(17,24,39,0)"]}
                locations={[0, 0.45, 0.85]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.text}>
                <Text style={styles.title} numberOfLines={2}>
                  {t(slide.title)}
                </Text>
                <Text style={styles.accent} numberOfLines={2}>
                  {t(slide.accent)}
                </Text>
                <Pressable
                  onPress={() => open(slide.target)}
                  style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.buttonText}>{t("shopNow")}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
    height: HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#111827",
    ...Shadow.raised,
  },
  text: { flex: 1, justifyContent: "center", paddingHorizontal: 18, paddingRight: "42%" },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", lineHeight: 26 },
  accent: {
    marginTop: 6,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  dots: { marginTop: 10, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#CBD5E1" },
  dotActive: { width: 20, backgroundColor: Colors.primary },
});
