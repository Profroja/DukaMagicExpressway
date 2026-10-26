import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StaffStatusBadge } from "@/components/StaffStatusBadge";
import { ErrorState } from "@/components/ui";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { formatMoney } from "@/lib/catalog";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { fetchStaffWork, SessionExpired, useStaff, type StaffOrderStatus, type StaffWork, type StaffWorkRow } from "@/lib/staff";

type Preset = "today" | "yesterday" | "7" | "30" | "month";

const PRESETS: { key: Preset; label: TranslationKey }[] = [
  { key: "today", label: "rangeToday" },
  { key: "yesterday", label: "rangeYesterday" },
  { key: "7", label: "range7" },
  { key: "30", label: "range30" },
  { key: "month", label: "rangeMonth" },
];

const OPEN: { status: StaffOrderStatus; color: string }[] = [
  { status: "new", color: "#3B82F6" },
  { status: "contacted", color: "#0EA5E9" },
  { status: "confirmed", color: "#6366F1" },
  { status: "sourcing", color: "#F59E0B" },
  { status: "picked_up", color: "#F97316" },
  { status: "delivered", color: "#14B8A6" },
];

/** Local calendar day as YYYY-MM-DD. */
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function presetRange(key: Preset): [Date, Date] {
  const now = new Date();
  if (key === "yesterday") return [daysAgo(1), daysAgo(1)];
  if (key === "7") return [daysAgo(6), now];
  if (key === "30") return [daysAgo(29), now];
  if (key === "month") return [new Date(now.getFullYear(), now.getMonth(), 1), now];
  return [now, now];
}

function parseDay(day: string) {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function short(day: Date, sw: boolean) {
  return day.toLocaleDateString(sw ? "sw-TZ" : "en-GB", { day: "numeric", month: "short" });
}

function when(value: string | null, sw: boolean) {
  if (!value) return "—";
  return new Date(value).toLocaleString(sw ? "sw-TZ" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

/**
 * Staff: what they did in a date range - orders received and closed, and the
 * money collected - with today's numbers always on top.
 */
export default function StaffWorkScreen() {
  const { t, language } = useLanguage();
  const sw = language === "sw";
  const insets = useSafeAreaInsets();
  const { session, signOut, orders } = useStaff();
  const [preset, setPreset] = useState<Preset | null>("today");
  const [from, setFrom] = useState(() => new Date());
  const [to, setTo] = useState(() => new Date());
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [data, setData] = useState<StaffWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"closed" | "received" | "daily">("closed");
  const [reload, setReload] = useState(0);

  const fromKey = iso(from);
  const toKey = iso(to);
  const token = session?.token;

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetchStaffWork(token, fromKey, toKey)
      .then((result) => {
        if (!alive) return;
        setData(result);
        setFailed(false);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof SessionExpired) signOut().then(() => router.replace("/staff/login"));
        else setFailed(true);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fromKey, toKey, reload]);

  const choosePreset = (key: Preset) => {
    const [a, b] = presetRange(key);
    setPreset(key);
    setLoading(true);
    setFrom(a);
    setTo(b);
  };

  const onPicked = (event: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    setPicking(null);
    if (event.type !== "set" || !date || !which) return;
    setPreset(null);
    setLoading(true);
    if (which === "from") {
      setFrom(date);
      if (date > to) setTo(date);
    } else {
      setTo(date);
      if (date < from) setFrom(date);
    }
  };

  const totals = data?.totals;
  const currency = data?.closed_orders[0]?.currency ?? "TZS";
  const money = (value: string | number) => formatMoney(currency, value);
  const openTotal = OPEN.reduce((sum, o) => sum + (data?.open[o.status] ?? 0), 0);
  const rangeText = fromKey === toKey ? short(from, sw) : `${short(from, sw)} – ${short(to, sw)}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setReload((n) => n + 1);
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header with today's numbers */}
        <LinearGradient
          colors={[Colors.navy, Colors.navySoft, "#C2410C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back} accessibilityLabel={t("back")}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("myWork")}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {session?.user.name}
                {session?.user.city ? ` · ${session.user.city}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>
              <Ionicons name="sunny" size={12} color="rgba(255,255,255,0.8)" /> {t("collectedToday")}
            </Text>
            <Text style={styles.todayMoney} numberOfLines={1} adjustsFontSizeToFit>
              {data ? money(data.today.collected) : "…"}
            </Text>
            <View style={styles.todayRow}>
              <TodayPill icon="checkmark-done" label={t("closedToday")} value={data?.today.closed} />
              <TodayPill icon="notifications" label={t("newToday")} value={data?.today.received} />
            </View>
          </View>
        </LinearGradient>

        {/* Date range */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => choosePreset(p.key)}
              style={[styles.preset, preset === p.key && styles.presetOn]}
            >
              <Text style={[styles.presetText, preset === p.key && styles.presetTextOn]}>{t(p.label)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.dates}>
          <DateButton label={t("fromDate")} value={short(from, sw)} active={!preset} onPress={() => setPicking("from")} />
          <Ionicons name="arrow-forward" size={16} color={Colors.textFaint} />
          <DateButton label={t("toDate")} value={short(to, sw)} active={!preset} onPress={() => setPicking("to")} />
        </View>
        {picking && (
          <DateTimePicker
            value={picking === "from" ? from : to}
            mode="date"
            maximumDate={new Date()}
            onChange={onPicked}
          />
        )}

        {failed && !data ? (
          <ErrorState
            onRetry={() => {
              setLoading(true);
              setReload((n) => n + 1);
            }}
          />
        ) : !data ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={[styles.body, loading && { opacity: 0.5 }]}>
            <Text style={styles.rangeText}>{rangeText}</Text>

            {/* Range widgets */}
            <View style={styles.grid}>
              <Widget
                icon="wallet"
                color="#F97316"
                bg="#FFF7ED"
                label={t("moneyCollected")}
                value={money(totals?.collected ?? 0)}
                note={t("exactPaid")}
                wide
              />
              <Widget
                icon="checkmark-done-circle"
                color="#059669"
                bg="#ECFDF5"
                label={t("ordersClosed")}
                value={String(totals?.closed ?? 0)}
                note={t("deliveredCount", { n: String(totals?.delivered ?? 0) })}
              />
              <Widget
                icon="file-tray-full"
                color="#2563EB"
                bg="#EFF6FF"
                label={t("ordersReceived")}
                value={String(totals?.received ?? 0)}
                note={t("cancelledCount", { n: String(totals?.cancelled ?? 0) })}
              />
              <Widget
                icon="trending-up"
                color="#7C3AED"
                bg="#F5F3FF"
                label={t("avgPerOrder")}
                value={money(totals?.average ?? 0)}
                wide
              />
            </View>

            {/* Chart */}
            {data.daily.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t("collectedPerDay")}</Text>
                <DailyBars daily={data.daily} sw={sw} />
              </View>
            )}

            {/* Waiting now */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{t("waitingNow")}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{openTotal}</Text>
                </View>
              </View>
              <Text style={styles.cardHint}>{t("anyDate")}</Text>
              {OPEN.map((o) => {
                const count = data.open[o.status] ?? 0;
                return (
                  <View key={o.status} style={styles.openRow}>
                    <View style={{ width: 112 }}>
                      <StaffStatusBadge status={o.status} />
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { backgroundColor: o.color, width: `${openTotal ? (count / openTotal) * 100 : 0}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.openCount}>{count}</Text>
                  </View>
                );
              })}
            </View>

            {/* Tables */}
            <View style={styles.card}>
              <View style={styles.tabs}>
                {(
                  [
                    ["closed", "tabClosed", data.closed_orders.length],
                    ["received", "tabReceived", data.received_orders.length],
                    ["daily", "tabDaily", data.daily.length],
                  ] as const
                ).map(([key, label, count]) => (
                  <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]}>
                    <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>{t(label)}</Text>
                    <Text style={[styles.tabCount, tab === key && { color: Colors.primary }]}>{count}</Text>
                  </Pressable>
                ))}
              </View>

              {tab === "daily" ? (
                <DailyTable data={data} money={money} sw={sw} t={t} />
              ) : (
                <OrdersTable
                  rows={tab === "closed" ? data.closed_orders : data.received_orders}
                  canOpen={(id) => orders.some((o) => o.id === id)}
                  mode={tab}
                  money={money}
                  sw={sw}
                  t={t}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TodayPill({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: number | undefined;
}) {
  return (
    <View style={styles.todayPill}>
      <Ionicons name={icon} size={16} color="#FFFFFF" />
      <View>
        <Text style={styles.todayPillValue}>{value ?? "…"}</Text>
        <Text style={styles.todayPillLabel}>{label}</Text>
      </View>
    </View>
  );
}

function DateButton({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.dateButton, active && styles.dateButtonOn]}>
      <Ionicons name="calendar-outline" size={16} color={active ? Colors.primary : Colors.textMuted} />
      <View>
        <Text style={styles.dateLabel}>{label}</Text>
        <Text style={styles.dateValue}>{value}</Text>
      </View>
    </Pressable>
  );
}

function Widget({
  icon,
  color,
  bg,
  label,
  value,
  note,
  wide,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bg: string;
  label: string;
  value: string;
  note?: string | undefined;
  wide?: boolean | undefined;
}) {
  return (
    <View style={[styles.widget, wide ? { width: "100%" } : { flex: 1 }]}>
      <View style={[styles.widgetIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.widgetValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.widgetLabel}>{label}</Text>
        {!!note && <Text style={styles.widgetNote}>{note}</Text>}
      </View>
    </View>
  );
}

function DailyBars({ daily, sw }: { daily: StaffWork["daily"]; sw: boolean }) {
  const values = daily.map((d) => Number(d.collected));
  const max = Math.max(1, ...values);
  const every = Math.ceil(daily.length / 7);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bars}>
      {daily.map((d, i) => {
        const value = values[i] ?? 0;
        return (
          <View key={d.date} style={styles.barCol}>
            <Text style={styles.barValue}>{value ? compact(value) : ""}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: `${Math.max(value ? 4 : 0, (value / max) * 100)}%` }]} />
            </View>
            <Text style={styles.barLabel}>{i % every === 0 ? short(parseDay(d.date), sw) : ""}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

type T = ReturnType<typeof useLanguage>["t"];

function OrdersTable({
  rows,
  canOpen,
  mode,
  money,
  sw,
  t,
}: {
  rows: StaffWorkRow[];
  /** Only the latest orders are kept in the app; older ones can't be opened. */
  canOpen: (id: string) => boolean;
  mode: "closed" | "received";
  money: (v: string | number) => string;
  sw: boolean;
  t: T;
}) {
  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="file-tray-outline" size={30} color="#CBD5E1" />
        <Text style={styles.emptyText}>{t("nothingInPeriod")}</Text>
      </View>
    );
  }
  const sum = rows.reduce((s, r) => s + Number(mode === "closed" ? (r.amount_paid ?? 0) : r.grand_total), 0);
  return (
    <View>
      {rows.map((r, i) => (
        <Pressable
          key={r.id}
          disabled={!canOpen(r.id)}
          onPress={() => router.push({ pathname: "/staff/[id]", params: { id: r.id } })}
          style={[styles.tr, i % 2 === 1 && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.trTitle} numberOfLines={1}>
              {r.listing_type === "service" ? "" : `${r.quantity}x `}
              {r.product_title}
            </Text>
            <Text style={styles.trSub} numberOfLines={1}>
              {r.customer_name} · {r.customer_phone}
            </Text>
            <View style={styles.trMeta}>
              {mode === "received" && <StaffStatusBadge status={r.status} />}
              <Text style={styles.trTime}>{when(mode === "closed" ? r.closed_at : r.created_at, sw)}</Text>
            </View>
          </View>
          <Text style={[styles.trAmount, mode === "closed" && { color: Colors.success }]}>
            {money(mode === "closed" ? (r.amount_paid ?? 0) : r.grand_total)}
          </Text>
        </Pressable>
      ))}
      <View style={styles.tfoot}>
        <Text style={styles.tfootLabel}>
          {t("total")} · {t("ordersCount", { n: String(rows.length) })}
        </Text>
        <Text style={styles.tfootValue}>{money(sum)}</Text>
      </View>
    </View>
  );
}

function DailyTable({
  data,
  money,
  sw,
  t,
}: {
  data: StaffWork;
  money: (v: string | number) => string;
  sw: boolean;
  t: T;
}) {
  return (
    <View>
      <View style={[styles.dRow, styles.dHead]}>
        <Text style={[styles.dDay, styles.dHeadText]}>{t("dayColumn")}</Text>
        <Text style={[styles.dNum, styles.dHeadText]}>
          <Ionicons name="file-tray-full" size={12} color={Colors.textFaint} />
        </Text>
        <Text style={[styles.dNum, styles.dHeadText]}>
          <Ionicons name="checkmark-done" size={12} color={Colors.textFaint} />
        </Text>
        <Text style={[styles.dMoney, styles.dHeadText]}>
          <Ionicons name="wallet" size={12} color={Colors.textFaint} />
        </Text>
      </View>
      {[...data.daily].reverse().map((d, i) => (
        <View key={d.date} style={[styles.dRow, i % 2 === 1 && { backgroundColor: "#F8FAFC" }]}>
          <Text style={styles.dDay}>{short(parseDay(d.date), sw)}</Text>
          <Text style={styles.dNum}>{d.received}</Text>
          <Text style={styles.dNum}>{d.closed}</Text>
          <Text style={[styles.dMoney, { color: Number(d.collected) ? Colors.success : Colors.textFaint }]}>
            {money(d.collected)}
          </Text>
        </View>
      ))}
      <View style={[styles.dRow, styles.tfoot]}>
        <Text style={[styles.dDay, styles.tfootLabel]}>{t("total")}</Text>
        <Text style={[styles.dNum, styles.tfootLabel]}>{data.totals.received}</Text>
        <Text style={[styles.dNum, styles.tfootLabel]}>{data.totals.closed}</Text>
        <Text style={[styles.dMoney, styles.tfootValue]}>{money(data.totals.collected)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  todayBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  todayLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "800" },
  todayMoney: { marginTop: 4, color: "#FFFFFF", fontSize: 30, fontWeight: "900" },
  todayRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  todayPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  todayPillValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  todayPillLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700" },
  presets: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  preset: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.card,
  },
  presetOn: { backgroundColor: Colors.primary },
  presetText: { fontSize: 13, fontWeight: "800", color: Colors.navy },
  presetTextOn: { color: "#FFFFFF" },
  dates: { marginTop: 10, marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  dateButtonOn: { borderColor: Colors.primary, backgroundColor: "#FFF7ED" },
  dateLabel: { fontSize: 10.5, fontWeight: "700", color: Colors.textFaint },
  dateValue: { fontSize: 14, fontWeight: "900", color: Colors.navy },
  body: { paddingHorizontal: 16 },
  rangeText: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.textFaint,
  },
  grid: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  widget: {
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    ...Shadow.card,
  },
  widgetIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  widgetValue: { fontSize: 19, fontWeight: "900", color: Colors.navy },
  widgetLabel: { marginTop: 1, fontSize: 12, fontWeight: "700", color: Colors.textMuted },
  widgetNote: { marginTop: 1, fontSize: 11, color: Colors.textFaint },
  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    ...Shadow.card,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "900", color: Colors.navy },
  cardHint: { marginTop: 2, marginBottom: 6, fontSize: 11.5, color: Colors.textFaint },
  badge: { minWidth: 26, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, fontWeight: "900", color: Colors.textMuted },
  openRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#F1F5F9", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  openCount: { width: 26, textAlign: "right", fontSize: 14, fontWeight: "900", color: Colors.navy },
  bars: { marginTop: 12, gap: 6, alignItems: "flex-end", minWidth: "100%", justifyContent: "space-between" },
  barCol: { width: 30, alignItems: "center" },
  barValue: { height: 14, fontSize: 9, fontWeight: "800", color: Colors.textMuted },
  barTrack: { width: 18, height: 120, justifyContent: "flex-end" },
  bar: { width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: Colors.primary },
  barLabel: { marginTop: 4, height: 14, fontSize: 9, fontWeight: "700", color: Colors.textFaint, width: 44, textAlign: "center" },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 6 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
  },
  tabOn: { backgroundColor: "#FFF7ED", borderWidth: 1.5, borderColor: Colors.primary },
  tabText: { fontSize: 12.5, fontWeight: "800", color: Colors.textMuted },
  tabTextOn: { color: Colors.primary },
  tabCount: { fontSize: 11, fontWeight: "900", color: Colors.textFaint },
  tr: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  trTitle: { fontSize: 13.5, fontWeight: "900", color: Colors.navy },
  trSub: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  trMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  trTime: { fontSize: 11, color: Colors.textFaint, fontWeight: "600" },
  trAmount: { fontSize: 13, fontWeight: "900", color: Colors.navy },
  tfoot: {
    marginTop: 4,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tfootLabel: { fontSize: 13, fontWeight: "900", color: Colors.navy },
  tfootValue: { fontSize: 14, fontWeight: "900", color: Colors.success },
  empty: { alignItems: "center", gap: 6, paddingVertical: 26 },
  emptyText: { fontSize: 13, color: Colors.textFaint, fontWeight: "600" },
  dRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingHorizontal: 8, borderRadius: 8 },
  dHead: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0", borderRadius: 0 },
  dHeadText: { fontSize: 11, fontWeight: "900", color: Colors.textFaint, textTransform: "uppercase" },
  dDay: { flex: 1, fontSize: 13, fontWeight: "800", color: Colors.navy },
  dNum: { width: 40, textAlign: "center", fontSize: 13, fontWeight: "700", color: Colors.textMuted },
  dMoney: { width: 120, textAlign: "right", fontSize: 13, fontWeight: "900" },
});
