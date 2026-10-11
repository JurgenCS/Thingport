import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/fileUtils";
import { parseBody } from "../utils/validate";
import {
  MAX_PAGE_SIZE,
  NOTIFICATION_FILTERS,
  deleteAllNotifications,
  deleteNotification,
  listNotifications,
  markAllRead,
} from "../services/notificationService";
import { toNotificationOut } from "../dto";

const router = Router();
router.use(requireAuth);

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  before: z.string().optional(),
  filter: z.enum(NOTIFICATION_FILTERS).optional(),
  since: z.coerce.date().optional(),
});
router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const query = parseBody(listQuerySchema, req.query);
    const { items, unreadCount, nextCursor } = await listNotifications(req.userId!, query);
    res.json({ items: items.map(toNotificationOut), unread_count: unreadCount, next_cursor: nextCursor });
  }),
);

router.post(
  "/notifications/read-all",
  asyncHandler(async (req, res) => {
    const readAt = await markAllRead(req.userId!);
    res.json({ ok: true, read_at: readAt.toISOString() });
  }),
);

router.delete(
  "/notifications/:id",
  asyncHandler(async (req, res) => {
    if (!(await deleteNotification(req.userId!, req.params.id))) throw new HttpError(404, "Notification not found");
    res.json({ ok: true });
  }),
);

// With a filter, only that tab's notifications.
const deleteQuerySchema = z.object({
  filter: z.enum(NOTIFICATION_FILTERS).optional(),
  since: z.coerce.date().optional(),
});
router.delete(
  "/notifications",
  asyncHandler(async (req, res) => {
    const { filter, since } = parseBody(deleteQuerySchema, req.query);
    await deleteAllNotifications(req.userId!, filter, since);
    res.json({ ok: true });
  }),
);

export default router;
