import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { DAR_ES_SALAAM, PIN_ICON, getCurrentPosition, loadGoogleMaps } from "@/lib/googleMaps";

export type LatLng = { lat: number; lng: number };

/**
 * Small Google map with a draggable pin. "Use my location" moves the pin to the
 * device's GPS position; tapping the map or dragging the pin fine-tunes it.
 */
export function LocationPicker({
  value,
  onChange,
  locateLabel = "Use my location",
  className = "h-56",
}: {
  value: LatLng | null;
  onChange: (point: LatLng) => void;
  locateLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Build the map once; it starts at the current value or Dar es Salaam.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        const center = value ?? DAR_ES_SALAAM;
        const map = new google.maps.Map(ref.current, {
          center,
          zoom: value ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        mapRef.current = map;
        const marker = new google.maps.Marker({
          map,
          position: center,
          visible: !!value,
          draggable: true,
          icon: {
            url: PIN_ICON,
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 34),
          },
        });
        markerRef.current = marker;
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) onChangeRef.current({ lat: p.lat(), lng: p.lng() });
        });
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          marker.setVisible(true);
          onChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) setMapError(e instanceof Error ? e.message : "Could not load the map.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow value changes made outside the map (e.g. GPS).
  useEffect(() => {
    if (!value || !markerRef.current || !mapRef.current) return;
    const current = markerRef.current.getPosition();
    if (current && current.lat() === value.lat && current.lng() === value.lng) return;
    markerRef.current.setPosition(value);
    markerRef.current.setVisible(true);
    mapRef.current.panTo(value);
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 16, 16));
  }, [value]);

  const locate = async () => {
    setLocating(true);
    setMapError(null);
    try {
      const pos = await getCurrentPosition();
      onChangeRef.current({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      const denied = (e as GeolocationPositionError)?.code === 1;
      setMapError(
        denied
          ? "Location access was blocked. Allow it in the browser, or tap the map to place the pin."
          : "Could not get your location. Tap the map to place the pin.",
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}
      >
        <div ref={ref} className="absolute inset-0" />
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-black text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-70"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
          {locateLabel}
        </button>
      </div>
      {mapError && <p className="text-[11px] font-semibold text-red-600">{mapError}</p>}
      {value && (
        <p className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
          <MapPin className="size-3 text-primary" />
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
