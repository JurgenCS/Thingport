import { useEffect, useState } from "react";
import { settingsApi, type WeatherLocation } from "../api/settings";

// Saved on the account so every device shows the same weather. Shared by every user of the hook so
// there's one request, and a change shows everywhere at once.
let cached: WeatherLocation | null | undefined;
let inFlight: Promise<WeatherLocation | null> | null = null;
const listeners = new Set<(value: WeatherLocation | null) => void>();

function load(): Promise<WeatherLocation | null> {
  if (cached !== undefined) return Promise.resolve(cached);
  // A change made while this is in flight is newer than the server's answer, so it wins.
  inFlight ??= settingsApi
    .getWeatherLocation()
    .then((res) => (cached = cached === undefined ? res.location : cached))
    .catch(() => cached ?? null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

function publish(value: WeatherLocation | null) {
  cached = value;
  listeners.forEach((listener) => listener(value));
}

/** Undefined while loading, null when the user hasn't set a location. */
export function useWeatherLocation(): [WeatherLocation | null | undefined, (location: WeatherLocation | null) => void] {
  const [value, setValue] = useState<WeatherLocation | null | undefined>(cached);

  useEffect(() => {
    let cancelled = false;
    void load().then((v) => {
      if (!cancelled) setValue(cached === undefined ? v : cached);
    });
    listeners.add(setValue);
    return () => {
      cancelled = true;
      listeners.delete(setValue);
    };
  }, []);

  const update = (location: WeatherLocation | null) => {
    publish(location);
    // Already applied here; a failed save only means other devices won't follow.
    settingsApi.updateWeatherLocation(location).catch(() => {});
  };

  return [value, update];
}
