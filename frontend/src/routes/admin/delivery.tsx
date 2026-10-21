import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Plus, Route as RouteIcon, Save, Trash2, Truck, Warehouse } from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationPicker, type LatLng } from "@/components/LocationPicker";
import { reverseGeocode } from "@/lib/googleMaps";

export const Route = createFileRoute("/admin/delivery")({
  component: AdminDeliveryPage,
});

type Range = { key: string; min_km: string; max_km: string; fee: string };

type DeliveryPayload = {
  hub: { name: string; address: string; latitude: string | null; longitude: string | null };
  ranges: { id: string; min_km: string; max_km: string; fee: string }[];
  configured: boolean;
  road_distance: boolean;
};

const trim = (v: string) => String(Number(v));
let nextKey = 0;
const newKey = () => `r${nextKey++}`;

function AdminDeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hub, setHub] = useState<LatLng | null>(null);
  const [ranges, setRanges] = useState<Range[]>([]);
  const [configured, setConfigured] = useState(false);
  const [roadDistance, setRoadDistance] = useState(false);

  const apply = (data: DeliveryPayload) => {
    setName(data.hub.name);
    setAddress(data.hub.address);
    setHub(
      data.hub.latitude && data.hub.longitude
        ? { lat: Number(data.hub.latitude), lng: Number(data.hub.longitude) }
        : null,
    );
    setRanges(
      data.ranges.map((r) => ({
        key: newKey(),
        min_km: trim(r.min_km),
        max_km: trim(r.max_km),
        fee: trim(r.fee),
      })),
    );
    setConfigured(data.configured);
    setRoadDistance(data.road_distance);
  };

  useEffect(() => {
    fetch("/api/admin/delivery/", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DeliveryPayload | null) => {
        if (data) apply(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const pickHub = (point: LatLng) => {
    setHub(point);
    if (!address.trim()) {
      reverseGeocode(point.lat, point.lng).then((label) => {
        if (label) setAddress((prev) => prev || label);
      });
    }
  };

  const update = (key: string, field: keyof Omit<Range, "key">, value: string) =>
    setRanges((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const addRange = () =>
    setRanges((prev) => {
      const last = prev[prev.length - 1];
      const from = last ? last.max_km : "0";
      const to = String((Number(from) || 0) + 5);
      return [...prev, { key: newKey(), min_km: from, max_km: to, fee: "" }];
    });

  const save = async () => {
    for (const r of ranges) {
      if (r.min_km === "" || r.max_km === "" || r.fee === "") {
        Swal.fire({
          title: "Fill every range",
          text: "Each range needs from, to and fee.",
          icon: "warning",
        });
        return;
      }
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/delivery/", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hub: {
            name: name.trim(),
            address: address.trim(),
            latitude: hub ? hub.lat.toFixed(6) : null,
            longitude: hub ? hub.lng.toFixed(6) : null,
          },
          ranges: ranges.map(({ min_km, max_km, fee }) => ({ min_km, max_km, fee })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Swal.fire({
          title: "Not saved",
          text: data.error || "Something went wrong.",
          icon: "error",
        });
        return;
      }
      apply(data);
      Swal.fire({
        title: "Saved",
        text: data.configured
          ? "Customers now see the delivery fee when they order."
          : "Saved. Set the main store location and at least one range to start charging delivery.",
        icon: "success",
        timer: 2200,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...ranges].sort((a, b) => Number(a.min_km) - Number(b.min_km));
  const maxKm = sorted.length ? Math.max(...sorted.map((r) => Number(r.max_km) || 0)) : 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Delivery</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deliveries start at our main store. The customer's fee comes from how far they are,
            using the km price ranges below.
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving || loading}
          className="shrink-0 bg-gradient-to-r from-primary to-orange-600"
        >
          <Save className="size-4" /> {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div
        className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
          configured
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <Truck className="mt-0.5 size-5 shrink-0" />
        <div>
          {configured ? (
            <p className="font-semibold">
              Delivery fees are on. Customers must share their location to order goods
              {maxKm ? `, up to ${maxKm} km away` : ""}.
            </p>
          ) : (
            <p className="font-semibold">
              Delivery fees are off. Set the main store location and add at least one range, then
              save.
            </p>
          )}
          <p className="mt-0.5 text-xs opacity-80">
            Distance:{" "}
            {roadDistance
              ? "driving distance by road (Google Routes)."
              : "straight line. Add GOOGLE_MAPS_API_KEY to the backend .env to use driving distance."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main store */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-3">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Warehouse className="size-5 text-primary" /> Main store location
            </h2>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. DukaHub - Kariakoo"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-slate-400" /> Location name
                </Label>
                <Input
                  className="mt-1.5"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kariakoo, Dar es Salaam"
                />
              </div>
            </div>
            <LocationPicker
              value={hub}
              onChange={pickHub}
              locateLabel="Use my current location"
              className="h-80"
            />
            <p className="mt-2 text-xs text-slate-400">
              Tap the map or drag the pin to the exact spot of the main store.
            </p>
          </div>

          {/* Price ranges */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2">
            <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
              <RouteIcon className="size-5 text-primary" /> Delivery fee by distance
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              From – to (km) and the fee in TZS. Customers farther than the last range can't order
              goods for delivery.
            </p>

            {ranges.length === 0 ? (
              <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
                No ranges yet.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1.3fr_auto] gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>From km</span>
                  <span>To km</span>
                  <span>Fee (TZS)</span>
                  <span className="w-9" />
                </div>
                {ranges.map((r) => (
                  <div key={r.key} className="grid grid-cols-[1fr_1fr_1.3fr_auto] gap-2">
                    <Input
                      inputMode="decimal"
                      value={r.min_km}
                      onChange={(e) => update(r.key, "min_km", e.target.value)}
                    />
                    <Input
                      inputMode="decimal"
                      value={r.max_km}
                      onChange={(e) => update(r.key, "max_km", e.target.value)}
                    />
                    <Input
                      inputMode="numeric"
                      value={r.fee}
                      onChange={(e) => update(r.key, "fee", e.target.value)}
                      placeholder="e.g. 3000"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setRanges((prev) => prev.filter((x) => x.key !== r.key))}
                      aria-label="Remove range"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" className="mt-3 w-full" onClick={addRange}>
              <Plus className="size-4" /> Add range
            </Button>

            {sorted.some((r) => r.fee !== "") && (
              <div className="mt-5 rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold text-slate-500">Customers will pay</p>
                <ul className="space-y-1 text-sm">
                  {sorted.map((r) => (
                    <li key={r.key} className="flex justify-between text-slate-700">
                      <span>
                        {r.min_km || "?"} – {r.max_km || "?"} km
                      </span>
                      <span className="font-bold">TZS {(Number(r.fee) || 0).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
