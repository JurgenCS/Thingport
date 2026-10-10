import { useState } from "react";
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
export default function DashboardModelThumb({ model }: { model: DashboardModel }) {
  const [thumbnails] = useDashboardThumbnails();
  const [pictureFailed, setPictureFailed] = useState(false);
  // Hidden until the choice is known, so the lists don't flash photos first.
  if (thumbnails === null || thumbnails === "none") return null;
  const picture =
    thumbnails === "monochrome" && model.model_image_url && !pictureFailed
      ? printsApi.fileUrl(model.model_image_url)
      : null;
  const photo = model.thumb_url ? printsApi.fileUrl(model.thumb_url) : undefined;
  return (
    <ListItemAvatar sx={{ minWidth: 48 }}>
      <Avatar
        src={picture ?? photo}
        variant="rounded"
        slotProps={{ img: { onError: () => picture && setPictureFailed(true) } }}
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
