import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Radius } from "@/constants/theme";
import { useLanguage, type Language } from "@/lib/i18n";

const HEADINGS = ["Choose your language", "Chagua lugha yako"];

const OPTIONS: { lang: Language; flag: string; name: string; hint: string }[] = [
  { lang: "sw", flag: "🇹🇿", name: "Kiswahili", hint: "Endelea kwa Kiswahili" },
  { lang: "en", flag: "🇬🇧", name: "English", hint: "Continue in English" },
];

/**
 * First-launch language choice. Shown once (until a language is saved); it
 * sits under the splash, so it is revealed as the splash fades away.
 */
export function LanguagePicker() {
  const { chosen, choose } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  const [picked, setPicked] = useState<Language | null>(null);
  const [heading, setHeading] = useState(0);
  // Animated values live in state (created once) so render never reads a ref.
  const [logo] = useState(() => new Animated.Value(0));
  const [headingFade] = useState(() => new Animated.Value(1));
  const [cards] = useState(() => OPTIONS.map(() => new Animated.Value(0)));
  const [pressScale] = useState(() => OPTIONS.map(() => new Animated.Value(1)));
  const [exit] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));

  const needed = chosen === false;

  // Entrance: logo pops, cards rise one after the other; glow drifts forever.
  useEffect(() => {
    if (!needed) return;
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.stagger(
        140,
        cards.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    drift.start();
    return () => drift.stop();
  }, [needed, logo, cards, glow]);

  // The heading alternates between both languages with a soft fade.
  useEffect(() => {
    if (!needed) return;
    const timer = setInterval(() => {
      Animated.timing(headingFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setHeading((h) => (h + 1) % HEADINGS.length);
        Animated.timing(headingFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    }, 2400);
    return () => clearInterval(timer);
  }, [needed, headingFade]);

  if (chosen === null || (!needed && !picked) || !visible) return null;

  const pick = (lang: Language, index: number) => {
    if (picked) return;
    setPicked(lang);
    Animated.sequence([
      Animated.spring(pressScale[index], { toValue: 1.06, friction: 4, useNativeDriver: true }),
      Animated.delay(250),
      Animated.timing(exit, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => setVisible(false));
    // Saved straight away, so the app behind already shows the new language.
    choose(lang);
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        {
          opacity: exit,
          transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
        },
      ]}
    >
      <LinearGradient
        colors={["#0A1F5C", "#081A4D", "#2A1206"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* The picture, slowly zooming in, fading into the panel below. */}
      <Animated.View
        style={[
          styles.hero,
          {
            height: Math.round(height * 0.44),
            opacity: logo,
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
          },
        ]}
      >
        <Image
          source={require("@/assets/images/language-hero.jpg")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="left"
        />
        <LinearGradient
          colors={["rgba(10,31,92,0)", "rgba(10,31,92,0.6)", "#0A1F5C"]}
          locations={[0.45, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.glow,
          styles.glowSoft,
          { bottom: -140, right: -120 },
          { transform: [{ translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }] },
        ]}
      />

      <View
        style={[
          styles.content,
          { marginTop: Math.round(height * 0.44) - 56, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Animated.View
          style={[
            styles.brandRow,
            {
              opacity: logo,
              transform: [{ translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="cover" />
          <View>
            <Text style={styles.brandName}>
              Soko<Text style={{ color: Colors.primary }}>Link</Text>
            </Text>
            <Text style={styles.brand}>WELCOME · KARIBU</Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.heading, { opacity: headingFade }]}>{HEADINGS[heading]}</Animated.Text>

        <View style={styles.cards}>
          {OPTIONS.map((option, i) => {
            const isPicked = picked === option.lang;
            const dimmed = !!picked && !isPicked;
            return (
              <Animated.View
                key={option.lang}
                style={{
                  opacity: Animated.multiply(cards[i], dimmed ? 0.35 : 1),
                  transform: [
                    { translateY: cards[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                    { scale: pressScale[i] },
                  ],
                }}
              >
                <Pressable
                  onPress={() => pick(option.lang, i)}
                  style={({ pressed }) => [
                    styles.card,
                    isPicked && styles.cardPicked,
                    pressed && !picked && { transform: [{ scale: 0.97 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={option.name}
                >
                  <Text style={styles.flag}>{option.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{option.name}</Text>
                    <Text style={[styles.cardHint, isPicked && { color: "rgba(255,255,255,0.9)" }]}>
                      {option.hint}
                    </Text>
                  </View>
                  {isPicked ? (
                    <View style={styles.check}>
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.45)" />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 90 },
  glow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(249,115,22,0.28)",
  },
  glowSoft: { width: 420, height: 420, borderRadius: 210, backgroundColor: "rgba(234,88,12,0.18)" },
  hero: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" },
  content: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 22 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  brandName: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  brand: {
    marginTop: 3,
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  heading: { marginTop: 18, color: "#FFFFFF", fontSize: 30, fontWeight: "900", lineHeight: 36 },
  sub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 19,
  },
  cards: { marginTop: 22, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  cardPicked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flag: { fontSize: 40 },
  cardName: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  cardHint: { marginTop: 2, color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { marginTop: 18, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 11 },
});
