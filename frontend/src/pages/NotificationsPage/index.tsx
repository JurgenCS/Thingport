import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Notification, NotificationFilter } from "../../api/notifications";
import { useConfirm } from "../../components/ConfirmProvider";
import { ListRowSkeletons } from "../../components/ListSkeleton";
import NotificationList from "../../components/notifications/NotificationList";
import NotificationTabs, { clearConfirmKey, emptyKey } from "../../components/notifications/NotificationTabs";
import { useNotificationFeed, useOpenedSince } from "../../components/notifications/useNotificationFeed";

type Props = {
  onUnauthorized?: () => void;
};

const PAGE_SIZE = 20;

function tabFrom(value: string | null): NotificationFilter {
  if (value === "unread") return "unread";
  if (value === "system") return "system";
  return "all";
}

/** Every notification, a page at a time as you scroll. */
export default function NotificationsPage({ onUnauthorized }: Props) {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = tabFrom(searchParams.get("tab"));
  const opened = useOpenedSince();
  const feed = useNotificationFeed(filter, PAGE_SIZE, opened, onUnauthorized);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const { loadMore, done, failed } = feed;

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || done || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, done, failed]);

  const setFilter = (next: NotificationFilter) =>
    setSearchParams(next === "all" ? {} : { tab: next }, { replace: true });

  const handleOpen = (notification: Notification) => {
    if (notification.internal_path) navigate(notification.internal_path);
  };

  const handleClear = async () => {
    const confirmed = await confirmDialog({
      message: t(clearConfirmKey(filter)),
      confirmLabel: t("notifications.clearAll"),
      destructive: true,
    });
    if (confirmed) void feed.clear();
  };

  const firstLoad = feed.loading && feed.items.length === 0;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 220 }}>
          {t("notifications.retention")}
        </Typography>
        {feed.items.length > 0 && (
          <Button color="error" onClick={() => void handleClear()} sx={{ flexShrink: 0 }}>
            {t("notifications.clearAll")}
          </Button>
        )}
      </Stack>
      {feed.failed && <Alert severity="error">{t("notifications.loadFailed")}</Alert>}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <NotificationTabs value={filter} onChange={setFilter} />
        <Box sx={{ borderTop: 1, borderColor: "divider", p: 1.5 }}>
          {firstLoad ? (
            <ListRowSkeletons count={6} lead="circle" leadSize={36} twoLines />
          ) : feed.items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              {t(emptyKey(filter))}
            </Typography>
          ) : (
            <NotificationList
              items={feed.items}
              since={opened.since}
              onOpen={handleOpen}
              onDelete={(n) => void feed.remove(n)}
            />
          )}
          {!feed.done && !firstLoad && (
            <Box ref={sentinelRef} sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              {feed.loading && <CircularProgress size={20} />}
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
