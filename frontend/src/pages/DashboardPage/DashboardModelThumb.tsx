import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import type { DashboardModel } from "../../api/dashboard";
import { printsApi } from "../../api/prints";
import { useDashboardThumbnails } from "../../hooks/useDashboardThumbnails";

/**
 * A dashboard list row's picture, as the user chose: none, the model's photo, or the server's
 * one-colour drawing of it. Until a drawing is made (the first request queues it) or for files it
 * can't draw, the photo stands in.
 */
// A drawing that isn't ready yet is asked for again after these waits, then the photo stays.
const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000];

export default function DashboardModelThumb({ model }: { model: DashboardModel }) {
  const [thumbnails] = useDashboardThumbnails();
  // Failed loads so far; past the last retry the photo stays for good.
  const [attempt, setAttempt] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const pictureFailed = attempt > RETRY_DELAYS_MS.length;

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setWaiting(false), RETRY_DELAYS_MS[attempt - 1]);
    return () => window.clearTimeout(timer);
  }, [waiting, attempt]);

  // Hidden until the choice is known, so the lists don't flash photos first.
  if (thumbnails === null || thumbnails === "none") return null;
  const url = thumbnails === "monochrome" && !pictureFailed && !waiting ? model.model_image_url : null;
  // Each retry asks afresh, so a cached "not ready" answer isn't reused.
  const picture = url
    ? printsApi.fileUrl(attempt ? `${url}${url.includes("?") ? "&" : "?"}attempt=${attempt}` : url)
    : null;
  const photo = model.thumb_url ? printsApi.fileUrl(model.thumb_url) : undefined;
  return (
    <ListItemAvatar sx={{ minWidth: 48 }}>
      <Avatar
        src={picture ?? photo}
        variant="rounded"
        slotProps={{
          img: {
            // Rows scrolled out of a long list don't ask the server to draw anything yet.
            loading: "lazy",
            onError: () => {
              if (!picture) return;
              setAttempt((count) => count + 1);
              setWaiting(true);
            },
          },
        }}
        sx={{
          width: 40,
          height: 40,
          bgcolor: picture ? "transparent" : undefined,
          color: "text.disabled",
          // The drawing is dark; on a dark card it's turned light instead.
          "& img": picture ? { filter: (theme) => (theme.palette.mode === "dark" ? "invert(1)" : "none") } : undefined,
        }}
      >
        <ViewInArIcon fontSize="small" />
      </Avatar>
    </ListItemAvatar>
  );
}
