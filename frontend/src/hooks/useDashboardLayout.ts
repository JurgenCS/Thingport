import { useEffect, useState } from "react";
import { settingsApi, type DashboardLayout } from "../api/settings";

// Saved on the account so every device lays the dashboard out the same way. Shared by every user of
// the hook so there's one request, and a switch shows everywhere at once.
let cached: DashboardLayout | undefined;
let inFlight: Promise<DashboardLayout> | null = null;
const listeners = new Set<(value: DashboardLayout) => void>();

function load(): Promise<DashboardLayout> {
  if (cached !== undefined) return Promise.resolve(cached);
  // A switch made while this is in flight is newer than the server's answer, so it wins.
  inFlight ??= settingsApi
    .getDashboardLayout()
    .then((res) => (cached ??= res.layout))
    .catch((): DashboardLayout => cached ?? "left")
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

function publish(value: DashboardLayout) {
  cached = value;
  listeners.forEach((listener) => listener(value));
}

/** Null until the saved choice is known, so the dashboard doesn't flash the wrong layout. */
export function useDashboardLayout(): [DashboardLayout | null, (layout: DashboardLayout) => void] {
  const [value, setValue] = useState<DashboardLayout | null>(cached ?? null);

  useEffect(() => {
    let cancelled = false;
    void load().then((v) => {
      if (!cancelled) setValue(cached ?? v);
    });
    listeners.add(setValue);
    return () => {
      cancelled = true;
      listeners.delete(setValue);
    };
  }, []);

  const update = (layout: DashboardLayout) => {
    publish(layout);
    // The switch already happened here; a failed save only means other devices won't follow.
    settingsApi.updateDashboardLayout(layout).catch(() => {});
  };

  return [value, update];
}
