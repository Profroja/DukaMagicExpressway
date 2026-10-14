import { useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import {
  categoryIcon,
  type CategoryKind,
  type CategoryLists,
  type NewCategory,
} from "@/lib/categories";

type Tone = "dark" | "light";

type StyleKey = "label" | "input" | "chip" | "chipOn" | "icon" | "tick" | "hint" | "newChip";

const STYLES: Record<Tone, Record<StyleKey, string>> = {
  dark: {
    label: "text-white/90",
    input: "border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-primary",
    chip: "border-white/15 bg-white/5 text-white/70 hover:border-primary/50 hover:bg-white/10 hover:text-white",
    chipOn: "border-primary bg-primary/25 text-white shadow-md ring-1 ring-primary/50",
    icon: "text-white/50",
    tick: "border-white/25",
    hint: "text-white/50",
    newChip: "bg-primary/25 text-white ring-1 ring-primary/50",
  },
  light: {
    label: "text-slate-700",
    input:
      "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary",
    chip: "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
    chipOn: "border-primary bg-orange-50 text-slate-900 ring-1 ring-primary/30",
    icon: "text-slate-400",
    tick: "border-slate-300",
    hint: "text-slate-400",
    newChip: "bg-orange-50 text-slate-900 ring-1 ring-primary/40",
  },
};

/**
 * Pick the categories a store sells from the full list, or type a new one
 * when nothing fits (any kind of good, food included, or any service).
 */
export function CategoryPicker({
  kind,
  lists,
  selected,
  onToggle,
  newCategories,
  onAddNew,
  onRemoveNew,
  tone = "light",
}: {
  kind: CategoryKind | "both";
  lists: CategoryLists;
  selected: string[];
  onToggle: (name: string) => void;
  newCategories: NewCategory[];
  onAddNew: (category: NewCategory) => void;
  onRemoveNew: (name: string) => void;
  tone?: Tone;
}) {
  const groups: CategoryKind[] = kind === "both" ? ["goods", "services"] : [kind];
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <Group
          key={group}
          group={group}
          options={lists[group].map((c) => c.name)}
          selected={selected}
          onToggle={onToggle}
          added={newCategories.filter((c) => c.type === group)}
          onAddNew={onAddNew}
          onRemoveNew={onRemoveNew}
          tone={tone}
        />
      ))}
    </div>
  );
}

function Group({
  group,
  options,
  selected,
  onToggle,
  added,
  onAddNew,
  onRemoveNew,
  tone,
}: {
  group: CategoryKind;
  options: string[];
  selected: string[];
  onToggle: (name: string) => void;
  added: NewCategory[];
  onAddNew: (category: NewCategory) => void;
  onRemoveNew: (name: string) => void;
  tone: Tone;
}) {
  const s = STYLES[tone];
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const term = query.trim().toLowerCase();
  const shown = term ? options.filter((o) => o.toLowerCase().includes(term)) : options;
  const count = selected.filter((n) => options.includes(n)).length + added.length;

  const addTyped = () => {
    const name = typed.replace(/\s+/g, " ").trim();
    if (name.length < 2) return;
    const existing = options.find((o) => o.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selected.includes(existing)) onToggle(existing);
    } else if (!added.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      onAddNew({ name, type: group });
    }
    setTyped("");
    setQuery("");
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className={`text-sm font-bold ${s.label}`}>
          {group === "goods" ? "Goods you sell" : "Services you offer"}{" "}
          <span className="text-primary">*</span>
        </label>
        {count > 0 && <span className="text-xs font-bold text-primary">{count} selected</span>}
      </div>

      <div className="relative mb-2">
        <Search className={`absolute left-3 top-1/2 size-4 -translate-y-1/2 ${s.icon}`} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            group === "goods"
              ? "Search: food, phones, furniture..."
              : "Search: cleaning, tutoring, tours..."
          }
          className={`h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition ${s.input}`}
        />
      </div>

      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {shown.map((name) => {
          const Icon = categoryIcon(name, group);
          const on = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => onToggle(name)}
              className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${on ? s.chipOn : s.chip}`}
            >
              <Icon className={`size-4 shrink-0 ${on ? "text-primary" : s.icon}`} />
              <span className="flex-1 leading-tight">{name}</span>
              <span
                className={`grid size-4 shrink-0 place-items-center rounded-full border ${on ? "border-primary bg-primary" : s.tick}`}
              >
                {on && <Check className="size-3 text-white" />}
              </span>
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className={`col-span-full py-3 text-center text-xs ${s.hint}`}>
            Not in the list — add it below.
          </p>
        )}
      </div>

      {added.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {added.map((c) => (
            <span
              key={c.name}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${s.newChip}`}
            >
              <Check className="size-3 text-primary" /> {c.name}
              <button
                type="button"
                onClick={() => onRemoveNew(c.name)}
                aria-label={`Remove ${c.name}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTyped();
            }
          }}
          maxLength={60}
          placeholder={
            group === "goods"
              ? "Can't find it? Type it, e.g. Spices"
              : "Can't find it? Type it, e.g. Wedding planning"
          }
          className={`h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none transition ${s.input}`}
        />
        <button
          type="button"
          onClick={addTyped}
          disabled={typed.trim().length < 2}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          <Plus className="size-4" /> Add
        </button>
      </div>
    </div>
  );
}
