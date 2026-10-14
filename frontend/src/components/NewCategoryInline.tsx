import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { CategoryKind } from "@/lib/categories";

export type StoreCategoryOption = {
  id: string;
  name: string;
  parent: string | null;
  listing_type: "product" | "service";
};

/**
 * "+ New category" link under a category select: adds a category the store
 * sells when nothing in its list fits (POSTs {name, type} to `endpoint`).
 */
export function NewCategoryInline({
  endpoint,
  kinds,
  onCreated,
}: {
  endpoint: string;
  kinds: CategoryKind[];
  onCreated: (categories: StoreCategoryOption[], newId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryKind>(kinds[0] ?? "goods");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (name.trim().length < 2) return setError("Type a category name.");
    setSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not add the category.");
        return;
      }
      onCreated(data.categories ?? [], data.category_id);
      setName("");
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
      >
        <Plus className="size-3.5" /> New category
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50/60 p-2.5">
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          maxLength={60}
          placeholder="e.g. Spices, Wedding planning"
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
        />
        {kinds.length > 1 && (
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CategoryKind)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
          >
            <option value="goods">Goods</option>
            <option value="services">Service</option>
          </select>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-9 shrink-0 rounded-lg bg-primary px-3 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
