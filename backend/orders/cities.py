"""Tanzanian cities used to route customer orders to the staff of that city."""
from orders.delivery import straight_line_km

# City centres (lat, lng).
CITIES = {
    "Dar es Salaam": (-6.7924, 39.2083),
    "Arusha": (-3.3869, 36.6830),
    "Mwanza": (-2.5164, 32.9175),
    "Dodoma": (-6.1630, 35.7516),
    "Mbeya": (-8.9094, 33.4608),
    "Morogoro": (-6.8278, 37.6591),
    "Tanga": (-5.0689, 39.0988),
    "Zanzibar": (-6.1659, 39.2026),
    "Moshi": (-3.3348, 37.3404),
    "Iringa": (-7.7700, 35.6900),
    "Tabora": (-5.0167, 32.8000),
    "Kigoma": (-4.8769, 29.6267),
    "Mtwara": (-10.2667, 40.1833),
    "Lindi": (-9.9969, 39.7144),
    "Shinyanga": (-3.6619, 33.4232),
    "Singida": (-4.8167, 34.7500),
    "Songea": (-10.6833, 35.6500),
    "Musoma": (-1.5000, 33.8000),
    "Bukoba": (-1.3317, 31.8122),
    "Sumbawanga": (-7.9667, 31.6167),
    "Babati": (-4.2167, 35.7500),
    "Kibaha": (-6.7667, 38.9167),
}

# Orders further than this from every city centre get no city (all staff see them).
MAX_KM = 150


def nearest_city(lat, lng):
    """Name of the closest city to a point, or "" when none is near."""
    if lat is None or lng is None:
        return ""
    best, best_km = "", MAX_KM
    for name, (clat, clng) in CITIES.items():
        km = straight_line_km(lat, lng, clat, clng)
        if km < best_km:
            best, best_km = name, km
    return best
