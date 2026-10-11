import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/i18n";

/**
 * Branded launch screen. The native splash (orange + logo, from app.json)
 * hands over to this animated version: the logo pops in, the name and tagline
 * rise, a loading bar fills, then everything fades into the app.
 */
export function SplashOverlay({ ready }: { ready: boolean }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  // Animated values live in state (created once) so render never reads a ref.
  const [logoScale] = useState(() => new Animated.Value(0.6));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [textY] = useState(() => new Animated.Value(16));
  const [textOpacity] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));
  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Our overlay is drawn - swap out the static native splash.
    SplashScreen.hide();
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => setIntroFinished(true));
  }, [logoOpacity, logoScale, progress, textOpacity, textY]);

  // Leave once the intro has played and saved data has loaded.
  useEffect(() => {
    if (!introFinished || !ready) return;
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [introFinished, ready, overlayOpacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: overlayOpacity }]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark, "#C2410C"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* soft decorative circles */}
      <View style={[styles.circle, { top: -90, right: -70, width: 260, height: 260 }]} />
      <View style={[styles.circle, { bottom: -120, left: -80, width: 300, height: 300 }]} />

      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <View style={styles.logoRing}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
      </Animated.View>

      <Animated.View
        style={{ alignItems: "center", opacity: textOpacity, transform: [{ translateY: textY }] }}
      >
        <Text style={styles.title}>
          Duka Magic <Text style={styles.titleAccent}>Expressway</Text>
        </Text>
        <Text style={styles.tagline}>{t("splashTagline")}</Text>
      </Animated.View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100, alignItems: "center", justifyContent: "center" },
  circle: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  logoRing: {
    padding: 6,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: "#7C2D12",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  logo: { width: 120, height: 120, borderRadius: 34 },
  title: { marginTop: 28, fontSize: 26, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.2 },
  titleAccent: { color: Colors.navy },
  tagline: { marginTop: 8, fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  progressTrack: {
    position: "absolute",
    bottom: 80,
    width: 140,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 4, backgroundColor: "#FFFFFF" },
});
