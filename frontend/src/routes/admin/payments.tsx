import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Info, Pencil, Plus, Save, Smartphone, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { providerStyle, type PaymentAccount } from "@/lib/lipa";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
});

type Provider = { value: string; label: string };
type Draft = {
  provider: string;
  provider_name: string;
  number: string;
  account_name: string;
  note: string;
};

const EMPTY: Draft = {
  provider: "mpesa",
  provider_name: "",
  number: "",
  account_name: "",
  note: "",
};

/** Admin: the lipa numbers customers pay to before sending an order. */
function AdminPaymentsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payment-accounts/", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Could not load lipa numbers.");
        setAccounts(data.accounts);
        setProviders(data.providers);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const needsName = draft.provider === "bank" || draft.provider === "other";

  const send = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Could not save.");
    setAccounts(data.accounts);
    return data;
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") await send("/api/admin/payment-accounts/", "POST", draft);
      else if (editing) await send(`/api/admin/payment-accounts/${editing}/`, "PATCH", draft);
      setEditing(null);
      Swal.fire({ icon: "success", title: "Saved", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Not saved", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (account: PaymentAccount) =>
    send(`/api/admin/payment-accounts/${account.id}/`, "PATCH", {
      is_active: !account.is_active,
    }).catch((e: Error) => Swal.fire({ icon: "error", title: "Not saved", text: e.message }));

  const remove = async (account: PaymentAccount) => {
    const answer = await Swal.fire({
      icon: "warning",
      title: "Delete this number?",
      text: `${account.provider_label} ${account.number} will no longer be shown to customers. Orders already paid to it keep their record.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!answer.isConfirmed) return;
    send(`/api/admin/payment-accounts/${account.id}/`, "DELETE").catch((e: Error) =>
      Swal.fire({ icon: "error", title: "Not deleted", text: e.message }),
    );
  };

  const move = (account: PaymentAccount, by: -1 | 1) => {
    const list = [...accounts];
    const i = list.findIndex((a) => a.id === account.id);
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    setAccounts(list);
    list.forEach((a, index) => {
      if (a.sort_order !== index)
        void send(`/api/admin/payment-accounts/${a.id}/`, "PATCH", { sort_order: index }).catch(
          () => {},
        );
    });
  };

  const startEdit = (account: PaymentAccount | null) => {
    setDraft(
      account
        ? {
            provider: account.provider,
            provider_name: account.provider_name,
            number: account.number,
            account_name: account.account_name,
            note: account.note,
          }
        : EMPTY,
    );
    setEditing(account ? account.id : "new");
  };

  const active = accounts.filter((a) => a.is_active).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Lipa Numbers</h1>
          <p className="mt-1 text-sm text-slate-500">
            The numbers customers pay to before sending an order. They tap{" "}
            <b>"Nimeshalipia / I've paid"</b> and the order shows which number they used.
          </p>
        </div>
        <Button onClick={() => startEdit(null)} className="rounded-xl font-bold">
          <Plus className="size-4" /> Add number
        </Button>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {!loading && active === 0 && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 size-4 shrink-0" />
          No active numbers: customers send orders without paying first (pay on delivery).
        </p>
      )}

      {/* Add / edit form */}
      {editing && (
        <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-navy">
              {editing === "new" ? "Add a lipa number" : "Edit lipa number"}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Provider</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {providers.map((p) => {
                  const style = providerStyle(p.value);
                  const on = draft.provider === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setDraft({ ...draft, provider: p.value })}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${
                        on
                          ? "border-primary bg-orange-50 text-navy"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`grid size-6 place-items-center rounded-md text-[9px] font-black ${style.bg} ${style.text}`}
                      >
                        {style.short.slice(0, 2)}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {needsName && (
              <div>
                <Label htmlFor="pname">Bank / provider name</Label>
                <Input
                  id="pname"
                  value={draft.provider_name}
                  onChange={(e) => setDraft({ ...draft, provider_name: e.target.value })}
                  placeholder="e.g. CRDB Bank"
                  className="mt-1.5"
                />
              </div>
            )}
            <div>
              <Label htmlFor="number">
                {draft.provider === "bank" ? "Account number" : "Lipa number"}
              </Label>
              <Input
                id="number"
                value={draft.number}
                onChange={(e) => setDraft({ ...draft, number: e.target.value })}
                placeholder="e.g. 5544332"
                className="mt-1.5 font-mono text-base font-bold"
              />
            </div>
            <div>
              <Label htmlFor="aname">Account name (what customers see when paying)</Label>
              <Input
                id="aname"
                value={draft.account_name}
                onChange={(e) => setDraft({ ...draft, account_name: e.target.value })}
                placeholder="e.g. SOKOLINK LTD"
                className="mt-1.5"
              />
            </div>
            <div className={needsName ? "" : "sm:col-span-2"}>
              <Label htmlFor="note">Tip for customers (optional)</Label>
              <Input
                id="note"
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="e.g. Piga *150*00# > Lipa kwa M-Pesa > Lipa namba"
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button onClick={save} disabled={saving} className="rounded-xl font-bold">
              <Save className="size-4" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* The numbers, in the order customers see them */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : accounts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <Smartphone className="size-10 text-slate-300" />
            <p className="font-bold text-slate-700">No lipa numbers yet</p>
            <p className="text-sm text-slate-500">Add your M-Pesa, Mixx or Airtel Money number.</p>
          </div>
        ) : (
          accounts.map((account, index) => {
            const style = providerStyle(account.provider);
            return (
              <div
                key={account.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                  account.is_active
                    ? "border-slate-200"
                    : "border-dashed border-slate-300 opacity-60"
                }`}
              >
                <div
                  className={`flex items-center justify-between px-4 py-3 ${style.bg} ${style.text}`}
                >
                  <span className="text-sm font-black">{account.provider_label}</span>
                  <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-bold">
                    {account.is_active ? `Shown #${index + 1}` : "Hidden"}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-mono text-2xl font-black tracking-wider text-navy">
                    {account.number}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">{account.account_name}</p>
                  {account.note && <p className="mt-1 text-xs text-slate-400">{account.note}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => startEdit(account)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggle(account)}>
                      {account.is_active ? (
                        <>
                          <EyeOff className="size-3.5" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" /> Show
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => remove(account)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <div className="ml-auto flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => move(account, -1)}
                        aria-label="Move up"
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === accounts.length - 1}
                        onClick={() => move(account, 1)}
                        aria-label="Move down"
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
