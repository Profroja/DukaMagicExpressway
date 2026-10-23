import { useEffect, useState } from "react";
import { Copy, MapPin, UserPlus } from "lucide-react";
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
import { useCities } from "@/lib/cities";

/** Admin creates a staff account for one city (password generated if left blank). */
export function AddStaffDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: unknown) => void;
}) {
  const cities = useCities();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Dar es Salaam");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ name: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setPhone("");
    setEmail("");
    setCity("Dar es Salaam");
    setPassword("");
    setError("");
    setResult(null);
    setCopied(false);
  }, [open]);

  const submit = async () => {
    setError("");
    if (!name.trim() || !phone.trim()) return setError("Enter the name and phone number.");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/users/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phone.trim(),
          email: email.trim(),
          city,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not create the account.");
        return;
      }
      onCreated(data.user);
      setResult({ name: data.user.name, password: data.password });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />{" "}
            {result ? "Staff account created" : "Add Staff"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? `${result.name} can sign in on the SokoLink app (person icon at the top) to get order alerts, and at /login on the website to process orders.`
              : "Staff get alerts for new orders in their city on the app and process them on the website."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          result.password ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Password — shown only once:</p>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <code className="flex-1 break-all font-mono text-lg font-bold text-slate-900">
                  {result.password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigator.clipboard.writeText(result.password ?? "").then(() => setCopied(true))
                  }
                >
                  <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              They sign in with the password you set.
            </p>
          )
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Full name</Label>
              <Input
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Neema Juma"
              />
            </div>
            <div>
              <Label>Phone number</Label>
              <Input
                className="mt-1.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255712345678"
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                className="mt-1.5"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="size-3.5 text-slate-400" /> City
              </Label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                {(cities.length ? cities : ["Dar es Salaam"]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Password (optional)</Label>
              <Input
                className="mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to generate"
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
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
                {saving ? "Creating..." : "Create staff account"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
