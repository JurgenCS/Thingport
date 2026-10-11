import { z } from "zod";
import { prisma } from "../db";
import { SYSTEM_NOTIFICATIONS_URL } from "../config";
import { UNREAD_RETENTION_DAYS } from "./notificationService";
import { createKeyedLock } from "../utils/concurrency";

const FETCH_TIMEOUT_MS = 15_000;
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const entrySchema = z.object({
  // Never reuse an id: it's what stops an entry from being sent twice.
  id: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).nullish(),
  // https only: an announcement's link goes in front of every admin of every instance.
  url: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"))
    .nullish(),
  published_at: z.coerce.date(),
  // Admins by default: most announcements are about running the instance.
  audience: z.enum(["admins", "all"]).default("admins"),
});
export type SystemNotificationEntry = z.infer<typeof entrySchema>;

/** One bad entry is skipped rather than hiding the rest. */
export function parseSystemNotifications(data: unknown): SystemNotificationEntry[] {
  const list = (data as { notifications?: unknown } | null)?.notifications;
  if (!Array.isArray(list)) return [];
  return list.flatMap((raw) => {
    const parsed = entrySchema.safeParse(raw);
    return parsed.success ? [parsed.data] : [];
  });
}

async function fetchSystemNotifications(url: string): Promise<SystemNotificationEntry[] | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return parseSystemNotifications(await res.json());
  } catch {
    return null;
  }
}

const WRITE_BATCH = 1000;
// Runs never overlap: the receipts read up front are what keeps an entry from being sent twice.
const withDeliveryLock = createKeyedLock();

/** Sends each user every entry meant for them they haven't had yet, as an ordinary notification dated
 *  when it was posted. Future entries wait for their date; ones past the unread retention aren't sent. */
export function deliverSystemNotifications(entries: SystemNotificationEntry[], now = new Date()): Promise<number> {
  return withDeliveryLock("system", async () => {
    const oldest = now.getTime() - UNREAD_RETENTION_DAYS * DAY_MS;
    const due = entries.filter((e) => e.published_at.getTime() <= now.getTime() && e.published_at.getTime() >= oldest);
    if (!due.length) return 0;
    const [users, receipts] = await Promise.all([
      prisma.user.findMany({ select: { id: true, role: true } }),
      prisma.systemReceipt.findMany({
        where: { systemId: { in: due.map((e) => e.id) } },
        select: { userId: true, systemId: true },
      }),
    ]);
    const seen = new Set(receipts.map((r) => `${r.userId}\n${r.systemId}`));
    const toSend = users.flatMap((user) =>
      due
        .filter((e) => (e.audience === "all" || user.role === "ADMIN") && !seen.has(`${user.id}\n${e.id}`))
        .map((entry) => ({ userId: user.id, entry })),
    );
    for (let i = 0; i < toSend.length; i += WRITE_BATCH) {
      const batch = toSend.slice(i, i + WRITE_BATCH);
      await prisma.$transaction([
        prisma.systemReceipt.createMany({
          data: batch.map(({ userId, entry }) => ({ userId, systemId: entry.id })),
          skipDuplicates: true,
        }),
        prisma.notification.createMany({
          data: batch.map(({ userId, entry }) => ({
            userId,
            type: "system",
            title: entry.title,
            body: entry.body ?? null,
            externalUrl: entry.url ?? null,
            createdAt: entry.published_at,
          })),
        }),
      ]);
    }
    return toSend.length;
  });
}

export async function syncSystemNotifications(url = SYSTEM_NOTIFICATIONS_URL): Promise<void> {
  if (!url) return;
  const entries = await fetchSystemNotifications(url);
  if (entries) await deliverSystemNotifications(entries);
}

/** Once at startup, then every few hours. */
export function startSystemNotificationSync(): void {
  const run = () =>
    syncSystemNotifications().catch((err) => console.error("Failed to sync system notifications:", err));
  void run();
  setInterval(run, SYNC_INTERVAL_MS).unref();
}
