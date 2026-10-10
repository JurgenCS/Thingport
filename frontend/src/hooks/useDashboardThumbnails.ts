import { useEffect, useState } from "react";
import { settingsApi, type DashboardThumbnails } from "../api/settings";

// Saved on the account so every device shows the same pictures. Shared by every user of
// the hook so there's one request, and a switch shows everywhere at once.
let cached: DashboardThumbnails | undefined;
let inFlight: Promise<DashboardThumbnails> | null = null;
const listeners = new Set<(value: DashboardThumbnails) => void>();

function load(): Promise<DashboardThumbnails> {
  if (cached !== undefined) return Promise.resolve(cached);
  // A switch made while this is in flight is newer than the server's answer, so it wins.
  inFlight ??= settingsApi
    .getDashboardThumbnails()
    .then((res) => (cached ??= res.thumbnails))
    .catch((): DashboardThumbnails => cached ?? "photos")
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

function publish(value: DashboardThumbnails) {
  cached = value;
  listeners.forEach((listener) => listener(value));
}

/** Null until the saved choice is known, so the lists don't flash the wrong pictures. */
export function useDashboardThumbnails(): [DashboardThumbnails | null, (thumbnails: DashboardThumbnails) => void] {
  const [value, setValue] = useState<DashboardThumbnails | null>(cached ?? null);

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

  const update = (thumbnails: DashboardThumbnails) => {
    publish(thumbnails);
    // The switch already happened here; a failed save only means other devices won't follow.
    settingsApi.updateDashboardThumbnails(thumbnails).catch(() => {});
  };

  return [value, update];
}
