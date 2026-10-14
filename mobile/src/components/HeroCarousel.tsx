import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, Radius, Shadow } from "@/constants/theme";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

/** Same pictures and words as the website's hero banners. */
const SLIDES: { image: number; title: TranslationKey; accent: TranslationKey; badge: TranslationKey }[] = [
  {
    image: require("@/assets/images/banners/hero-market.jpg"),
    title: "banner1Title",
    accent: "banner1Accent",
    badge: "banner1Badge",
  },
  {
    image: require("@/assets/images/banners/hero-home.jpg"),
    title: "banner2Title",
    accent: "banner2Accent",
    badge: "banner2Badge",
  },
  {
    image: require("@/assets/images/banners/hero-fashion.jpg"),
    title: "banner3Title",
    accent: "banner3Accent",
    badge: "banner3Badge",
  },
];

const INTERVAL_MS = 4500;
const HEIGHT = 190;

/** Three picture cards that slide by themselves; customers can also swipe them. */
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
            <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={["rgba(15,36,59,0.92)", "rgba(15,36,59,0.55)", "rgba(15,36,59,0.05)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.text}>
              <Text style={styles.title}>{t(slide.title)}</Text>
              <Text style={styles.accent}>{t(slide.accent)}</Text>
              <View style={styles.chips}>
                {(
                  [
                    ["pricetag", t("heroChipAffordable")],
                    ["flash", t("heroChipFast")],
                    ["time", t("heroChipAnyTime")],
                  ] as const
                ).map(([icon, label]) => (
                  <View key={label} style={styles.chip}>
                    <Ionicons name={icon} size={11} color="#FFFFFF" />
                    <Text style={styles.chipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t(slide.badge)}</Text>
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
    backgroundColor: Colors.navy,
    ...Shadow.raised,
  },
  text: { flex: 1, justifyContent: "center", paddingHorizontal: 18, paddingRight: 96 },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "900", lineHeight: 26 },
  accent: { marginTop: 4, color: Colors.primary, fontSize: 15, fontWeight: "900", lineHeight: 20 },
  chips: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  chipText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  badge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    transform: [{ rotate: "8deg" }],
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textAlign: "center", lineHeight: 14 },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});
