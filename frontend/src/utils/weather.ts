// Free, keyless services called from the browser: Open-Meteo for the forecast and place search,
// OpenStreetMap's Nominatim to name a detected location.

export type Weather = {
  temperature: number;
  code: number;
  high: number;
  low: number;
  /** A few hours from now. */
  later: { hours: number; temperature: number; code: number };
};

export type Place = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };

const LATER_HOURS = 6;
const CACHE_KEY = "thingport.weather";
const CACHE_TTL_MS = 30 * 60 * 1000;

type Cached = { at: number; lat: number; lon: number; weather: Weather };

function readCache(lat: number, lon: number): Weather | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as Cached | null;
    if (cached && cached.lat === lat && cached.lon === lon && Date.now() - cached.at < CACHE_TTL_MS)
      return cached.weather;
  } catch {
    // An unreadable cache just means asking again.
  }
  return null;
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const cached = readCache(lat, lon);
  if (cached) return cached;
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,weather_code",
    hourly: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_hours: String(LATER_HOURS + 1),
    forecast_days: "1",
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather service returned HTTP ${res.status}`);
  const data = await res.json();
  const weather: Weather = {
    temperature: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
    high: Math.round(data.daily.temperature_2m_max[0]),
    low: Math.round(data.daily.temperature_2m_min[0]),
    later: {
      hours: LATER_HOURS,
      temperature: Math.round(data.hourly.temperature_2m[LATER_HOURS]),
      code: data.hourly.weather_code[LATER_HOURS],
    },
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), lat, lon, weather } satisfies Cached));
  } catch {
    // Not caching only costs a request next time.
  }
  return weather;
}

export async function searchPlaces(query: string, language: string): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: "5", language, format: "json" });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error(`Place search returned HTTP ${res.status}`);
  return ((await res.json()).results ?? []) as Place[];
}

/** The town or city at a point, or null when it can't be named. */
export async function placeName(lat: number, lon: number, language: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: "json", zoom: "10" });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "Accept-Language": language },
    });
    const address = (await res.json()).address ?? {};
    return address.city || address.town || address.village || address.county || null;
  } catch {
    return null;
  }
}

/** WMO weather codes, grouped into what the dashboard shows. */
export type Condition = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export function conditionOf(code: number): Condition {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}
