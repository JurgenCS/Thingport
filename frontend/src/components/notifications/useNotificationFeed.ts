import React from "react";
import { UnauthorizedError } from "../../api/client";
import { notificationsApi, type Notification, type NotificationFilter } from "../../api/notifications";
import { useNotifications } from "../Layout/NotificationsContext";

/** Opening a list marks everything read, as it always has. The returned time is kept so the
 *  "unread" tab and the highlight still show what was new at that moment. */
export function useOpenedSince(): { since: string | null; ready: boolean } {
  const { markAllRead } = useNotifications();
  const [state, setState] = React.useState<{ since: string | null; ready: boolean }>({ since: null, ready: false });
  React.useEffect(() => {
    let active = true;
    void markAllRead().then((since) => {
      if (active) setState({ since, ready: true });
    });
    return () => {
      active = false;
    };
    // Once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

/** Unread, or read by this opening. */
export function isNew(notification: Notification, since: string | null): boolean {
  if (!notification.read) return true;
  return Boolean(since && notification.read_at && notification.read_at >= since);
}

/** One tab's notifications, a page at a time. Waits for `ready` so "unread" knows its `since`. */
export function useNotificationFeed(
  filter: NotificationFilter,
  pageSize: number,
  opened: { since: string | null; ready: boolean },
  onUnauthorized?: () => void,
) {
  const { refresh: refreshCount } = useNotifications();
  const { since, ready } = opened;
  const [items, setItems] = React.useState<Notification[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  // Drops pages that answer after the tab changed.
  const generation = React.useRef(0);
  const loadingRef = React.useRef(false);

  const handleError = React.useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) onUnauthorized?.();
      else setFailed(true);
    },
    [onUnauthorized],
  );

  const fetchPage = React.useCallback(
    async (before: string | null, reset: boolean) => {
      if (loadingRef.current && !reset) return;
      const current = reset ? ++generation.current : generation.current;
      loadingRef.current = true;
      setLoading(true);
      try {
        const page = await notificationsApi.list({ limit: pageSize, before, filter, since });
        if (current !== generation.current) return;
        setItems((prev) => {
          if (reset) return page.items;
          const seen = new Set(prev.map((n) => n.id));
          return [...prev, ...page.items.filter((n) => !seen.has(n.id))];
        });
        setCursor(page.next_cursor);
        setDone(page.next_cursor === null);
        setFailed(false);
      } catch (err) {
        if (current === generation.current) handleError(err);
      } finally {
        if (current === generation.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [filter, pageSize, since, handleError],
  );

  const loadMore = React.useCallback(() => {
    if (ready && !done) void fetchPage(cursor, false);
  }, [ready, cursor, done, fetchPage]);

  React.useEffect(() => {
    setItems([]);
    setDone(false);
    if (ready) void fetchPage(null, true);
  }, [ready, fetchPage]);

  const remove = React.useCallback(
    async (notification: Notification) => {
      setItems((prev) => prev.filter((n) => n.id !== notification.id));
      try {
        await notificationsApi.remove(notification.id);
      } catch (err) {
        handleError(err);
      }
      void refreshCount();
    },
    [handleError, refreshCount],
  );

  const clear = React.useCallback(async () => {
    try {
      await notificationsApi.clearAll(filter, since);
      setItems([]);
      setDone(true);
    } catch (err) {
      handleError(err);
    }
    void refreshCount();
  }, [filter, since, handleError, refreshCount]);

  return { items, loading: loading || !ready, done, failed, loadMore, remove, clear };
}
