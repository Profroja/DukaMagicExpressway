import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandLogo, Button } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useStaff } from "@/lib/staff";

/** Staff sign in (phone or email + password), then the staff order screens. */
export default function StaffLoginScreen() {
  const { t } = useLanguage();
  const { signIn } = useStaff();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    if (!username.trim() || !password) return setError(t("errLogin"));
    setError("");
    setBusy(true);
    try {
      await signIn(username.trim(), password);
      router.replace("/staff");
    } catch (e) {
      setError(e instanceof ApiError && e.message !== "network" ? e.message : t("errNetwork"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t("staffLogin") }} />
      <View style={styles.card}>
        <View style={{ alignItems: "center" }}>
          <BrandLogo size={64} />
          <Text style={styles.title}>{t("staffLogin")}</Text>
          <Text style={styles.hint}>{t("staffLoginHint")}</Text>
        </View>

        <Text style={styles.label}>{t("phoneOrEmail")}</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color={Colors.textFaint} />
          <TextInput
            value={username}
            onChangeText={(v) => {
              setUsername(v);
              setError("");
            }}
            placeholder="+255712345678"
            placeholderTextColor={Colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>{t("password")}</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textFaint} />
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError("");
            }}
            secureTextEntry={!show}
            placeholder="••••••••"
            placeholderTextColor={Colors.textFaint}
            returnKeyType="go"
            onSubmitEditing={submit}
            style={styles.input}
          />
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {!!error && (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={busy ? t("signingIn") : t("signIn")}
          icon="log-in-outline"
          loading={busy}
          onPress={submit}
          style={{ marginTop: 22 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  title: { marginTop: 14, fontSize: 22, fontWeight: "900", color: Colors.navy },
  hint: { marginTop: 6, textAlign: "center", fontSize: 13, lineHeight: 19, color: Colors.textMuted },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: Colors.navy,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  error: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "700", color: Colors.danger },
});
