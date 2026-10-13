import { useEffect, useRef, useState } from "react";
import { Check, Copy, ImagePlus, MapPin, Package, Store as StoreIcon, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Same category lists as vendor self-registration. */
const GOODS_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
  "Groceries",
  "Automotive",
  "Sports & Outdoors",
  "Books & Stationery",
];
const SERVICE_CATEGORIES = [
  "Electronics Repair",
  "Home Repair & Maintenance",
  "Vehicle Services",
  "Beauty & Spa",
  "Professional Services",
  "Cleaning",
  "Delivery & Logistics",
  "Catering & Food",
  "Photography",
];

type Kind = "goods" | "services" | "both";

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-orange-50 text-slate-900"
          : "border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      {active && <Check className="size-3 text-primary" />}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Create store                                                        */
/* ------------------------------------------------------------------ */

export function CreateStoreDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (store: unknown) => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [kind, setKind] = useState<Kind>("goods");
  const [categories, setCategories] = useState<string[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ store: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setLocation("");
    setKind("goods");
    setCategories([]);
    setOwnerName("");
    setOwnerPhone("");
    setOwnerEmail("");
    setOwnerPassword("");
    setError("");
    setResult(null);
    setCopied(false);
  }, [open]);

  const toggle = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const groups =
    kind === "goods"
      ? [{ title: "Goods", items: GOODS_CATEGORIES }]
      : kind === "services"
        ? [{ title: "Services", items: SERVICE_CATEGORIES }]
        : [
            { title: "Goods", items: GOODS_CATEGORIES },
            { title: "Services", items: SERVICE_CATEGORIES },
          ];

  const submit = async () => {
    setError("");
    const allowed = groups.flatMap((g) => g.items);
    const chosen = categories.filter((c) => allowed.includes(c));
    if (!name.trim()) return setError("Enter the store name.");
    if (!chosen.length) return setError("Select at least one category.");
    if (!ownerName.trim() || !ownerPhone.trim())
      return setError("Enter the owner's name and phone number.");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/stores/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location_name: location.trim(),
          category_type: kind,
          categories: chosen,
          owner_name: ownerName.trim(),
          owner_phone: ownerPhone.trim(),
          owner_email: ownerEmail.trim(),
          owner_password: ownerPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not create the store.");
        return;
      }
      onCreated(data.store);
      setResult({ store: data.store.name, password: data.owner_password });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="size-5 text-primary" /> {result ? "Store created" : "Add Store"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? `${result.store} is live and its owner can sign in at /login.`
              : "Creates the store (live straight away) and its owner's vendor login."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          result.password ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Owner's password — shown only once:</p>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <code className="flex-1 break-all font-mono text-lg font-bold text-slate-900">
                  {result.password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(result.password ?? "")
                      .then(() => setCopied(true));
                  }}
                >
                  <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Share it with the owner privately. They can change it later.
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              The owner signs in with the password you set (or their existing one).
            </p>
          )
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Store name</Label>
                <Input
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kariakoo Electronics"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-slate-400" /> Location name
                </Label>
                <Input
                  className="mt-1.5"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kariakoo, Dar es Salaam"
                />
              </div>
            </div>

            <div>
              <Label>What does it sell?</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    ["goods", "Goods", Package],
                    ["services", "Services", Wrench],
                    ["both", "Both", StoreIcon],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKind(key)}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-semibold transition ${
                      kind === key
                        ? "border-primary bg-orange-50 text-slate-900 ring-2 ring-primary/20"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {group.title} categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      active={categories.includes(c)}
                      onClick={() => toggle(c)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-bold text-slate-800">Owner (vendor login)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Full name</Label>
                  <Input
                    className="mt-1.5"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Juma Ali"
                  />
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input
                    className="mt-1.5"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+255712345678"
                  />
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    className="mt-1.5"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@example.com"
                  />
                </div>
                <div>
                  <Label>Password (optional)</Label>
                  <Input
                    className="mt-1.5"
                    type="text"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Leave blank to generate"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                If this phone already has an account without a store, that account becomes the
                owner.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={onClose} className="bg-gradient-to-r from-primary to-orange-600">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-orange-600"
              >
                {saving ? "Creating..." : "Create store"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Add product / service to a store                                    */
/* ------------------------------------------------------------------ */

type CategoryOpt = {
  id: string;
  name: string;
  parent: string | null;
  listing_type: "product" | "service";
};

export function AddProductDialog({
  store,
  onClose,
  onAdded,
}: {
  store: { id: string; name: string } | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setPrice("");
    setDescription("");
    setAvailable(true);
    setImage(null);
    setPreview(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    if (!store) return;
    reset();
    setAdded([]);
    setCategories([]);
    setLoadingCats(true);
    fetch(`/api/admin/stores/${store.id}/products/`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const all: CategoryOpt[] = data?.categories ?? [];
        // Sub-categories when the store has them (main category only otherwise).
        const subs = all.filter((c) => c.parent);
        const opts = subs.length ? subs : all;
        setCategories(opts);
        setCategoryId(opts[0]?.id ?? "");
      })
      .finally(() => setLoadingCats(false));
  }, [store]);

  const selected = categories.find((c) => c.id === categoryId);
  const isService = selected?.listing_type === "service";
  const hasBoth = new Set(categories.map((c) => c.listing_type)).size > 1;

  const submit = async () => {
    if (!store) return;
    setError("");
    if (!title.trim()) return setError("Enter a name.");
    if (!categoryId) return setError("Choose a category.");
    const amount = Number(price.replace(/,/g, ""));
    if (!isService && !(amount > 0)) return setError("Enter a valid price.");
    if (price && !(amount >= 0)) return setError("Enter a valid price.");
    if (!image) return setError("Add an image.");
    setSaving(true);
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("category_id", categoryId);
      body.append("price", price ? String(amount) : "");
      body.append("description", description.trim());
      body.append("available", String(available));
      body.append("image", image);
      const response = await fetch(`/api/admin/stores/${store.id}/products/`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not add it.");
        return;
      }
      setAdded((prev) => [...prev, data.listing?.title ?? title.trim()]);
      onAdded();
      reset();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!store} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isService ? (
              <Wrench className="size-5 text-primary" />
            ) : (
              <Package className="size-5 text-primary" />
            )}
            Add {isService ? "service" : "product"} to {store?.name}
          </DialogTitle>
          <DialogDescription>
            It goes live on the public site as soon as it's added (if marked available).
          </DialogDescription>
        </DialogHeader>

        {added.length > 0 && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Added: {added.join(", ")}. Add another or close.
          </div>
        )}

        {loadingCats ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            This store has no categories yet.
          </p>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) return setError("Image must be 5MB or smaller.");
                setImage(file);
                setPreview(URL.createObjectURL(file));
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-primary hover:text-primary"
            >
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm font-semibold">
                  <ImagePlus className="size-7" /> Choose an image
                  <span className="text-xs font-normal">JPG, PNG, WEBP · max 5MB</span>
                </span>
              )}
            </button>

            <div>
              <Label>Name</Label>
              <Input
                className="mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isService ? "e.g. Home Cleaning" : 'e.g. Smart TV 43"'}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  {hasBoth
                    ? (["product", "service"] as const).map((type) => (
                        <optgroup key={type} label={type === "product" ? "Goods" : "Services"}>
                          {categories
                            .filter((c) => c.listing_type === type)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </optgroup>
                      ))
                    : categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                </select>
              </div>
              <div>
                <Label>{isService ? "Starting price (optional)" : "Price (TZS)"}</Label>
                <Input
                  className="mt-1.5"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={isService ? "Blank = price on request" : "e.g. 650000"}
                />
              </div>
            </div>

            <div>
              <Label>Description {isService ? "" : "(optional)"}</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-md border border-input px-3 py-2 text-sm"
                placeholder={isService ? "What the service includes" : "Size, model, details..."}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="size-4 accent-orange-600"
              />
              Available to customers now
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {added.length ? "Done" : "Cancel"}
          </Button>
          <Button
            onClick={submit}
            disabled={saving || loadingCats || !categories.length}
            className="bg-gradient-to-r from-primary to-orange-600"
          >
            {saving ? "Adding..." : `Add ${isService ? "service" : "product"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
