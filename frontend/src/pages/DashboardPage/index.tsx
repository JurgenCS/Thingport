import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { UnauthorizedError } from "../../api/client";
import { dashboardApi, type DashboardSummary } from "../../api/dashboard";
import { usePageHeader } from "../../components/Layout/PageHeaderContext";
import { useDashboardWidgets } from "../../hooks/useDashboardWidgets";
import { useDashboardLayout } from "../../hooks/useDashboardLayout";
import DashboardCustomizeDialog from "./DashboardCustomizeDialog";
import { DASHBOARD_WIDGETS, isWidgetEnabled, type DashboardWidget } from "./widgets";
import { PUZZLE_COLUMNS, layoutDefinition, panelColumns, puzzlePieces } from "./layouts";

// Beside the panels, the count column is narrower than each panel column.
const COUNTS_FLEX = 1;
const PANEL_FLEX = 1.4;

type Props = {
  onUnauthorized?: () => void;
};

export default function DashboardPage({ onUnauthorized }: Props) {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [choices, setWidgetEnabled] = useDashboardWidgets();
  const [layout, setLayout] = useDashboardLayout();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  usePageHeader({
    actions: (
      <Tooltip title={t("dashboard.widgets.open")}>
        <IconButton size="small" onClick={() => setSettingsOpen(true)} aria-label={t("dashboard.widgets.open")}>
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  });

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await dashboardApi.getSummary();
        if (active) setSummary(data);
      } catch (err) {
        if (!active) return;
        if (err instanceof UnauthorizedError) onUnauthorized?.();
        else setError(t("dashboard.loadError"));
      }
    })();
    return () => {
      active = false;
    };
  }, [onUnauthorized, t]);

  let content: React.ReactNode;
  if (error) {
    content = (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  } else if (!summary || !choices || !layout) {
    content = (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  } else {
    const enabled = DASHBOARD_WIDGETS.filter((widget) => isWidgetEnabled(widget, choices));
    const definition = layoutDefinition(layout);
    const counts = enabled.filter((widget) => widget.column === 0);
    // An empty column is dropped, so the others widen into its space.
    const columns = panelColumns(
      definition,
      enabled.filter((widget) => widget.column !== 0),
    );
    const sideways = definition.counts === "left" || definition.counts === "right";
    const countsFirst = definition.counts === "left" || definition.counts === "top";
    const renderWidget = (widget: DashboardWidget) => (
      <React.Fragment key={widget.id}>{widget.render({ summary, t, navigate, onUnauthorized })}</React.Fragment>
    );

    const countsBlock = counts.length ? (
      <Box
        sx={
          sideways
            ? {
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: { xs: "100%", md: 0 },
                flex: { md: COUNTS_FLEX },
              }
            : // Above or below the panels, the counts share one row.
              { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }
        }
      >
        {counts.map(renderWidget)}
      </Box>
    ) : null;
    const panelsBlock = columns.length ? (
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: "flex-start",
          ...(sideways && { width: { xs: "100%", md: 0 }, flex: { md: columns.length * PANEL_FLEX } }),
        }}
      >
        {columns.map((column) => (
          <Box
            key={column[0].id}
            sx={{ display: "flex", flexDirection: "column", gap: 2, width: { xs: "100%", md: 0 }, flex: { md: 1 } }}
          >
            {column.map(renderWidget)}
          </Box>
        ))}
      </Box>
    ) : null;

    // Every box in one dense grid: pieces of different sizes, the small ones packed into the gaps.
    const puzzle = (
      <Box sx={{ p: { xs: 0, md: 1 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: `repeat(${PUZZLE_COLUMNS}, 1fr)` },
            gridAutoFlow: "dense",
            gap: 2,
          }}
        >
          {puzzlePieces(enabled).map(({ item, columns: span, rows }) => (
            <Box
              key={item.id}
              sx={{
                gridColumn: { sm: `span ${Math.min(span, 2)}`, md: `span ${span}` },
                gridRow: { md: `span ${rows}` },
                // A piece stretches to its whole area, so the puzzle has no holes inside it.
                display: "flex",
                flexDirection: "column",
                "& > *": { flex: 1 },
              }}
            >
              {item.render({ summary, t, navigate, onUnauthorized })}
            </Box>
          ))}
        </Box>
      </Box>
    );

    content =
      definition.counts === "mixed" && enabled.length ? (
        puzzle
      ) : countsBlock || panelsBlock ? (
        <Box sx={{ p: { xs: 0, md: 1 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: sideways ? { xs: "column", md: "row" } : "column",
              gap: 2,
              alignItems: sideways ? "flex-start" : "stretch",
            }}
          >
            {countsFirst ? countsBlock : panelsBlock}
            {countsFirst ? panelsBlock : countsBlock}
          </Box>
        </Box>
      ) : (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 10, textAlign: "center" }}>
          <Typography color="text.secondary">{t("dashboard.widgets.allHidden")}</Typography>
          <Button variant="outlined" startIcon={<SettingsOutlinedIcon />} onClick={() => setSettingsOpen(true)}>
            {t("dashboard.widgets.open")}
          </Button>
        </Stack>
      );
  }

  return (
    <>
      {content}
      <DashboardCustomizeDialog
        open={settingsOpen}
        layout={layout ?? "left"}
        onLayoutChange={setLayout}
        choices={choices ?? {}}
        onToggle={setWidgetEnabled}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
