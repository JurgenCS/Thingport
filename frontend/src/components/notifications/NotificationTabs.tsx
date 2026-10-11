import { useTranslation } from "react-i18next";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { NotificationFilter } from "../../api/notifications";

type Props = {
  value: NotificationFilter;
  onChange: (value: NotificationFilter) => void;
};

export default function NotificationTabs({ value, onChange }: Props) {
  const { t } = useTranslation("app");
  return (
    <Tabs
      value={value}
      onChange={(_event, next: NotificationFilter) => onChange(next)}
      variant="fullWidth"
      sx={{ minHeight: 38, "& .MuiTab-root": { minHeight: 38, py: 0.5, textTransform: "none", fontWeight: 600 } }}
    >
      <Tab value="all" label={t("notifications.tabAll")} />
      <Tab value="unread" label={t("notifications.tabUnread")} />
      <Tab value="system" label={t("notifications.tabSystem")} />
    </Tabs>
  );
}

/** The empty-state text for a tab. */
export function emptyKey(filter: NotificationFilter): string {
  if (filter === "unread") return "notifications.emptyUnread";
  if (filter === "system") return "notifications.emptySystem";
  return "notifications.empty";
}

/** The "Clear all" confirmation for a tab. */
export function clearConfirmKey(filter: NotificationFilter): string {
  if (filter === "unread") return "notifications.clearUnreadConfirm";
  if (filter === "system") return "notifications.clearSystemConfirm";
  return "notifications.clearAllConfirm";
}
