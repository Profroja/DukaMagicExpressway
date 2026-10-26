import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  Coins,
  Inbox,
  Receipt,
  Sun,
  TrendingUp,
  Truck,
  Users,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/my-work")({
  component: MyWorkPage,
});

type Row = {
  id: string;
  product_title: string;
  listing_type: string;
  quantity: number;
  customer_name: string;
  customer_phone: string;
  city: string;
  status: string;
  status_label: string;
  grand_total: string;
  amount_paid: string | null;
  created_at: string | null;
  closed_at: string | null;
  closed_by: string;
};

type Performance = {
  range: { from: string; to: string };
  team: boolean;
  person: { id: string; name: string; city: string; role: string };
  today: { date: string; received: number; closed: number; collected: string };
  totals: {
    received: number;
    closed: number;
    collected: string;
    average: string;
    delivered: number;
    cancelled: number;
  };
  open: Record<string, number>;
  daily: { date: string; received: number; closed: number; collected: string }[];
  closed_orders: Row[];
  received_orders: Row[];
  by_staff?: { id: string; name: string; city: string; closed: number; collected: string }[];
  staff_options?: { id: string; name: string; city: string }[];
};

const OPEN_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  sourcing: "At the store",
  picked_up: "On the way",
  delivered: "Delivered · to close",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-sky-100 text-sky-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  sourcing: "bg-amber-100 text-amber-700",
  picked_up: "bg-orange-100 text-orange-700",
  delivered: "bg-teal-100 text-teal-700",
  closed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const GRID = "#e1e0d9";
const AXIS_TEXT = "#898781";

/** Local calendar day as YYYY-MM-DD. */
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shift(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return iso(d);
}

const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "today", label: "Today", range: () => [shift(0), shift(0)] },
  { key: "yesterday", label: "Yesterday", range: () => [shift(-1), shift(-1)] },
  { key: "7d", label: "Last 7 days", range: () => [shift(-6), shift(0)] },
  { key: "30d", label: "Last 30 days", range: () => [shift(-29), shift(0)] },
  {
    key: "month",
    label: "This month",
    range: () => {
      const d = new Date();
      return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), shift(0)];
    },
  },
];

function tzs(value: string | number) {
  return `TZS ${Number(value).toLocaleString()}`;
}

function compact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function dayLabel(day: string) {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { day: "numeric", month: "short" });
}

function rangeLabel(from: string, to: string) {
  return from === to ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(to)}`;
}

function when(value: string | null) {
  return value
    ? new Date(value).toLocaleString([], {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

function MyWorkPage() {
  const [from, setFrom] = useState(shift(0));
  const [to, setTo] = useState(shift(0));
  const [staff, setStaff] = useState("");
  const [data, setData] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"closed" | "received" | "daily">("closed");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ from, to });
    if (staff) params.set("staff", staff);
    fetch(`/api/admin/orders/performance/?${params}`, { credentials: "include" })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) setError(json?.error || "Could not load your work.");
        else setData(json);
      })
      .catch(() => !cancelled && setError("Could not reach the server."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to, staff]);

  const activePreset = PRESETS.find((p) => {
    const [a, b] = p.range();
    return a === from && b === to;
  })?.key;
  const t = data?.totals;
  const team = data?.team ?? false;
  const isAdmin = !!data?.staff_options;
  const title = team
    ? "Team performance"
    : isAdmin && staff
      ? data?.person.name || "Staff"
      : "My work";
  const openTotal = Object.values(data?.open ?? {}).reduce((a, b) => a + b, 0);
  const chart = (data?.daily ?? []).map((d) => ({
    ...d,
    label: dayLabel(d.date),
    collected: Number(d.collected),
  }));

  const rangeCards = [
    {
      label: "Orders received",
      value: t ? t.received.toLocaleString() : "…",
      note: `${t?.cancelled ?? 0} cancelled`,
      icon: Inbox,
      style: "bg-blue-50 text-blue-600",
    },
    {
      label: "Orders closed",
      value: t ? t.closed.toLocaleString() : "…",
      note: `${t?.delivered ?? 0} delivered in this period`,
      icon: BadgeCheck,
      style: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Money collected",
      value: t ? tzs(t.collected) : "…",
      note: "Exactly what customers paid",
      icon: Coins,
      style: "bg-orange-50 text-orange-600",
    },
    {
      label: "Average per order",
      value: t ? tzs(t.average) : "…",
      note: "Collected ÷ closed",
      icon: TrendingUp,
      style: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {team
              ? "Orders received and closed, and money collected, by the whole team."
              : `Orders you received and closed, and the money you collected${
                  data?.person.city ? ` · ${data.person.city}` : ""
                }.`}
          </p>
        </div>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-slate-400" />
            <select
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none"
            >
              <option value="">Whole team</option>
              {(data?.staff_options ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.city ? ` · ${s.city}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Today */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-700 p-5 text-white shadow-lg sm:p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <Sun className="size-4" /> Today · {data ? dayLabel(data.today.date) : ""}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TodayStat label="Collected today" value={data ? tzs(data.today.collected) : "…"} big />
          <TodayStat label="Orders closed today" value={data ? String(data.today.closed) : "…"} />
          <TodayStat label="New orders today" value={data ? String(data.today.received) : "…"} />
        </div>
      </div>

      {/* Date range */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <CalendarRange className="ml-1 size-4 text-slate-400" />
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              const [a, b] = p.range();
              setFrom(a);
              setTo(b);
            }}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
              activePreset === p.key
                ? "bg-primary text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2 text-slate-700 focus:border-primary focus:outline-none"
            aria-label="From"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => e.target.value && setTo(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2 text-slate-700 focus:border-primary focus:outline-none"
            aria-label="To"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {/* Range cards */}
      <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
        {rangeLabel(from, to)}
      </p>
      <div
        className={`mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 ${loading ? "opacity-60" : ""}`}
      >
        {rangeCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
          >
            <div
              className={`mb-4 flex size-11 items-center justify-center rounded-lg ${card.style}`}
            >
              <card.icon className="size-6" />
            </div>
            <div className="text-xl font-black text-slate-900 sm:text-2xl">{card.value}</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{card.label}</div>
            <div className="mt-0.5 text-xs text-slate-400">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2">
          <h2 className="text-base font-black text-slate-900">Money collected per day</h2>
          <p className="text-xs text-slate-400">{rangeLabel(from, to)}</p>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                  minTickGap={12}
                />
                <YAxis
                  tickFormatter={compact}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(11,11,11,0.04)" }}
                  formatter={(value: number, name: string) =>
                    name === "collected" ? [tzs(value), "Collected"] : [value, name]
                  }
                  labelClassName="font-bold"
                />
                <Bar dataKey="collected" fill="#FF5A14" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waiting now */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">Waiting right now</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
              {openTotal}
            </span>
          </div>
          <p className="text-xs text-slate-400">Open orders, any date</p>
          <ul className="mt-4 space-y-2">
            {Object.entries(OPEN_LABEL).map(([key, label]) => {
              const count = data?.open[key] ?? 0;
              return (
                <li key={key} className="flex items-center gap-3">
                  <span
                    className={`w-36 shrink-0 rounded-md px-2 py-1 text-xs font-bold ${STATUS_STYLE[key]}`}
                  >
                    {label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${openTotal ? (count / openTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-black text-slate-800">{count}</span>
                </li>
              );
            })}
          </ul>
          <Link
            to="/admin/orders"
            className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-orange-600"
          >
            <Truck className="size-4" /> Go to orders
          </Link>
        </div>
      </div>

      {/* Per staff (admin, whole team) */}
      {team && (data?.by_staff?.length ?? 0) > 0 && (
        <Card title="By staff member" count={data?.by_staff?.length} icon={Users}>
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-3">Staff</th>
                <th className="py-3 pr-3">City</th>
                <th className="py-3 pr-3 text-right">Closed</th>
                <th className="py-3 text-right">Collected</th>
              </tr>
            </thead>
            <tbody>
              {data?.by_staff?.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setStaff(s.id)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-orange-50/50"
                >
                  <td className="py-3 pr-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 pr-3 text-slate-600">{s.city || "All cities"}</td>
                  <td className="py-3 pr-3 text-right font-bold text-slate-800">{s.closed}</td>
                  <td className="py-3 text-right font-black text-emerald-700">
                    {tzs(s.collected)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tables */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
          {(
            [
              ["closed", "Closed orders", data?.closed_orders.length, CheckCircle2],
              ["received", "Orders received", data?.received_orders.length, Inbox],
              ["daily", "Day by day", data?.daily.length, Receipt],
            ] as const
          ).map(([key, label, count, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                tab === key ? "bg-orange-50 text-primary" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="size-4" />
              {label}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {count ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto px-4 sm:px-6">
          {loading && !data ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading...</div>
          ) : tab === "closed" ? (
            <OrdersTable rows={data?.closed_orders ?? []} mode="closed" showStaff={team} />
          ) : tab === "received" ? (
            <OrdersTable rows={data?.received_orders ?? []} mode="received" showStaff={false} />
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-3">Day</th>
                  <th className="py-3 pr-3 text-right">Received</th>
                  <th className="py-3 pr-3 text-right">Closed</th>
                  <th className="py-3 text-right">Collected</th>
                </tr>
              </thead>
              <tbody>
                {[...(data?.daily ?? [])].reverse().map((d) => (
                  <tr key={d.date} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-3 font-semibold text-slate-800">{dayLabel(d.date)}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">{d.received}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">{d.closed}</td>
                    <td
                      className={`py-3 text-right font-black ${
                        Number(d.collected) ? "text-emerald-700" : "text-slate-300"
                      }`}
                    >
                      {tzs(d.collected)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 text-sm font-black text-slate-900">
                  <td className="py-3 pr-3">Total</td>
                  <td className="py-3 pr-3 text-right">{t?.received ?? 0}</td>
                  <td className="py-3 pr-3 text-right">{t?.closed ?? 0}</td>
                  <td className="py-3 text-right text-emerald-700">{tzs(t?.collected ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function TodayStat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-semibold text-white/70">{label}</p>
      <p className={`mt-1 font-black ${big ? "text-3xl" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function OrdersTable({
  rows,
  mode,
  showStaff,
}: {
  rows: Row[];
  mode: "closed" | "received";
  showStaff: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-sm text-slate-400">
        <XCircle className="size-8 text-slate-200" />
        Nothing in this period.
      </div>
    );
  }
  const total = rows.reduce(
    (sum, r) => sum + Number(mode === "closed" ? (r.amount_paid ?? 0) : r.grand_total),
    0,
  );
  return (
    <table className="w-full min-w-[760px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
          <th className="py-3 pr-3">{mode === "closed" ? "Closed" : "Placed"}</th>
          <th className="py-3 pr-3">Order</th>
          <th className="py-3 pr-3">Customer</th>
          <th className="py-3 pr-3">City</th>
          {mode === "received" && <th className="py-3 pr-3">Status</th>}
          {showStaff && <th className="py-3 pr-3">Closed by</th>}
          <th className="py-3 text-right">{mode === "closed" ? "Customer paid" : "Order total"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
            <td className="whitespace-nowrap py-3 pr-3 text-xs text-slate-500">
              {when(mode === "closed" ? r.closed_at : r.created_at)}
            </td>
            <td className="py-3 pr-3 font-semibold text-slate-900">
              {r.listing_type === "service" ? r.product_title : `${r.quantity}× ${r.product_title}`}
              {r.listing_type === "service" && (
                <span className="ml-1.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                  Booking
                </span>
              )}
            </td>
            <td className="py-3 pr-3 text-slate-600">
              {r.customer_name}
              <span className="block text-xs text-slate-400">{r.customer_phone}</span>
            </td>
            <td className="py-3 pr-3 text-slate-600">{r.city || "—"}</td>
            {mode === "received" && (
              <td className="py-3 pr-3">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${STATUS_STYLE[r.status] ?? ""}`}
                >
                  {r.status_label}
                </span>
              </td>
            )}
            {showStaff && <td className="py-3 pr-3 text-slate-600">{r.closed_by || "—"}</td>}
            <td
              className={`whitespace-nowrap py-3 text-right font-black ${
                mode === "closed" ? "text-emerald-700" : "text-slate-800"
              }`}
            >
              {tzs(mode === "closed" ? (r.amount_paid ?? 0) : r.grand_total)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-200 font-black text-slate-900">
          <td className="py-3 pr-3" colSpan={mode === "received" ? 5 : showStaff ? 5 : 4}>
            Total · {rows.length} order{rows.length === 1 ? "" : "s"}
          </td>
          <td className="py-3 text-right text-emerald-700">{tzs(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function Card({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number | undefined;
  icon: typeof Users;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 sm:px-6">
        <Icon className="size-4 text-slate-400" />
        <h2 className="text-base font-black text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
          {count ?? 0}
        </span>
      </div>
      <div className="overflow-x-auto px-4 sm:px-6">{children}</div>
    </div>
  );
}
