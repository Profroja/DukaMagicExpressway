import { useEffect, useState } from "react";

/** City names staff can be assigned to (from the backend). */
export function useCities() {
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/cities/")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCities(Array.isArray(data?.cities) ? data.cities : []))
      .catch(() => {});
  }, []);
  return cities;
}
