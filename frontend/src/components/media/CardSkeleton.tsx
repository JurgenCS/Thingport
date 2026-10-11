import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";

const cardBackground = (theme: Theme) =>
  theme.palette.mode === "dark" ? theme.thingport.pageBackground : theme.palette.grey[100];

// Collection cards have two cards peeking out below, this deep, so a placeholder takes the same room.
const COLLECTION_STACK_PX = 12;

type Props = {
  /** "model" has the author and counts row; "collection" a name and item count, over a stack. */
  variant?: "model" | "collection";
};

/** A model or collection card's shape while it loads: the preview, then its text lines. */
export function CardSkeleton({ variant = "model" }: Props) {
  return (
    <Box sx={{ pb: variant === "collection" ? `${COLLECTION_STACK_PX}px` : 0 }} aria-hidden>
      <Paper
        variant="outlined"
        sx={{ overflow: "hidden", borderRadius: "12px", borderColor: "transparent", bgcolor: cardBackground }}
      >
        <Skeleton variant="rectangular" sx={{ width: "100%", height: "auto", aspectRatio: "4 / 3" }} />
        <Box sx={{ px: 1.5, pt: 0.75, pb: 1.5 }}>
          <Skeleton variant="text" sx={{ fontSize: "0.875rem", width: "75%" }} />
          {variant === "model" ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" sx={{ fontSize: "0.75rem", width: "45%" }} />
              </Stack>
              <Skeleton variant="text" sx={{ fontSize: "0.75rem", width: 48 }} />
            </Stack>
          ) : (
            <Skeleton variant="text" sx={{ fontSize: "0.75rem", width: "35%", mt: 0.5 }} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}

/** Placeholder cards to fill a grid, e.g. while the first page loads or the next one is fetched. */
export function CardSkeletons({ count, variant }: Props & { count: number }) {
  return Array.from({ length: count }, (_, index) => <CardSkeleton key={index} variant={variant} />);
}
