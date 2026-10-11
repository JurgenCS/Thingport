import type { SxProps, Theme } from "@mui/material/styles";

// Where the card grids drop a column, widest first.
const BREAKPOINTS_PX = [1979, 1684, 1404, 1124, 860];

/** The model and collection card grids: `maxColumns` across on the widest screens, one fewer at each step down. */
export function cardGridSx(maxColumns: 5 | 6): SxProps<Theme> {
  const sx: Record<string, unknown> = {
    display: "grid",
    gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
    columnGap: "20px",
    rowGap: "20px",
  };
  // The first step keeps the full count; each one after drops a column.
  BREAKPOINTS_PX.forEach((width, step) => {
    sx[`@media (max-width: ${width}px)`] = { gridTemplateColumns: `repeat(${Math.max(1, maxColumns - step)}, 1fr)` };
  });
  return sx as SxProps<Theme>;
}
