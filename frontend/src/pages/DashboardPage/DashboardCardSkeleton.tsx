import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";

/** How a widget's placeholder looks: a count box, or a titled list of `rows`. */
export type DashboardSkeleton =
  | { kind: "count" }
  | {
      kind: "list";
      rows: number;
      /** Rows lead with an avatar or thumbnail, as model and author lists do. */
      avatar?: boolean;
      /** Ends with a "See more" link. */
      footer?: boolean;
    };

const cardBorder = (theme: Theme) => (theme.palette.mode === "dark" ? "transparent" : "divider");

/** A dashboard card's shape while the summary loads, matching CountCard and the list cards. */
export default function DashboardCardSkeleton({ skeleton }: { skeleton: DashboardSkeleton }) {
  if (skeleton.kind === "count") {
    return (
      <Paper
        variant="outlined"
        aria-hidden
        sx={{
          p: 3,
          minHeight: 140,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 1,
          borderColor: cardBorder,
        }}
      >
        <Skeleton variant="rounded" width={32} height={32} />
        <Skeleton variant="text" sx={{ fontSize: "3rem", width: "40%" }} />
        <Skeleton variant="text" sx={{ width: "55%" }} />
      </Paper>
    );
  }
  const { rows, avatar = true, footer = false } = skeleton;
  return (
    <Paper variant="outlined" aria-hidden sx={{ p: 2.5, borderColor: cardBorder }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" sx={{ fontSize: "1.25rem", width: "45%" }} />
      </Stack>
      <Stack spacing={1.25}>
        {Array.from({ length: rows }, (_, index) => (
          <Stack key={index} direction="row" alignItems="center" spacing={1.5} sx={{ px: 1 }}>
            {avatar ? (
              <Skeleton variant="rounded" width={40} height={40} sx={{ flexShrink: 0 }} />
            ) : (
              <Skeleton variant="rounded" width={88} height={22} sx={{ flexShrink: 0 }} />
            )}
            {/* Varied widths read as real names rather than a block. */}
            <Skeleton variant="text" sx={{ flex: 1, maxWidth: `${70 - (index % 3) * 12}%` }} />
            <Box sx={{ flex: 1 }} />
            <Skeleton variant="text" sx={{ width: 56, flexShrink: 0 }} />
          </Stack>
        ))}
      </Stack>
      {footer && <Skeleton variant="text" sx={{ width: 72, mt: 1.5, ml: 1 }} />}
    </Paper>
  );
}
