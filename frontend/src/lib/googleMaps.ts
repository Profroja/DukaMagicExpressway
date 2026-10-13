/** Google Maps JS loader shared by every map on the site (key from VITE_GOOGLE_MAPS_API_KEY). */

declare global {
  interface Window {
    __gmapsReady?: () => void;
  }
}

export const GOOGLE_MAPS_API_KEY = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as
  string | undefined;

/** Default map centre: Dar es Salaam. */
export const DAR_ES_SALAAM = { lat: -6.8161, lng: 39.289 };

export const PIN_ICON =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#F97316" stroke="#ffffff" stroke-width="1.6">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3.2" fill="#ffffff" stroke="none"/>
  </svg>`);

let gmapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (!GOOGLE_MAPS_API_KEY)
    return Promise.reject(new Error("Google Maps API key is not configured."));
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("gmaps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load Google Maps.")));
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    window.__gmapsReady = () => resolve();
    script.onerror = () => {
      gmapsPromise = null;
      reject(new Error("Could not load Google Maps."));
    };
    const timer = window.setTimeout(() => {
      reject(
        new Error(
          "Google Maps failed to load. Check that your API key is valid, enabled, and unrestricted to this origin.",
        ),
      );
    }, 12000);
    script.onload = () => window.clearTimeout(timer);
    document.head.appendChild(script);
  });
  return gmapsPromise;
}

/** Current GPS position (asks the browser for permission). */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support location access."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    });
  });
}

/** "Sinza, Dar es Salaam" style label for a point, or null. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    await loadGoogleMaps();
    const { results } = await new google.maps.Geocoder().geocode({ location: { lat, lng } });
    const first = results[0];
    if (!first) return null;
    const part = (type: string) =>
      first.address_components.find((c) => c.types.includes(type))?.long_name;
    const label = [part("sublocality") || part("neighborhood") || part("route"), part("locality")]
      .filter(Boolean)
      .join(", ");
    return label || first.formatted_address;
  } catch {
    return null;
  }
}

export const googleMapsLink = (lat: string | number, lng: string | number) =>
  `https://www.google.com/maps?q=${lat},${lng}`;
