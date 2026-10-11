-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "group" JSONB;

-- Existing notifications get the type their title shows, so they keep a matching icon.
UPDATE "Notification" SET "type" = 'queue' WHERE "title" LIKE '%waiting in the import queue';
UPDATE "Notification" SET "type" = 'consume' WHERE "title" LIKE 'Imported % from the consume folder';
UPDATE "Notification" SET "type" = 'sync'
WHERE "type" = 'general' AND (
  "title" LIKE '% synced into "%'
  OR "title" LIKE 'Couldn''t sync %'
  OR "title" LIKE 'Couldn''t find "%'
  OR "title" LIKE 'Syncing "%" is paused'
  OR "title" LIKE '"%" is no longer synced'
  OR "title" LIKE '"%" is up to date'
  OR "title" LIKE '% added to "%'
);
UPDATE "Notification" SET "type" = 'import' WHERE "type" = 'general' AND "title" LIKE 'Imported %';

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- A queue's "links waiting" notification is now an ordinary one that nothing edits or deletes.
ALTER TABLE "ImportJob" DROP COLUMN "notificationId";

-- Which system notifications each user was already sent, so they are never sent twice.
-- CreateTable
CREATE TABLE "SystemReceipt" (
    "userId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemReceipt_pkey" PRIMARY KEY ("userId","systemId")
);

-- CreateIndex
CREATE INDEX "SystemReceipt_createdAt_idx" ON "SystemReceipt"("createdAt");

-- AddForeignKey
ALTER TABLE "SystemReceipt" ADD CONSTRAINT "SystemReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
