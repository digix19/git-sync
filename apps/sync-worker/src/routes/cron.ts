import { Hono } from "hono";
import { db } from "../db.js";
import { requireApiKey } from "../middleware.js";
import { enqueueSync } from "../lib/sync.js";
import { repository, syncQueue, syncLog, syncLock, syncSecret } from "@gitsync/db/schema";
import { eq, and, lt, or, isNotNull } from "drizzle-orm";

const RETENTION_DAYS = 90;

export const cronRouter = new Hono()
  .post("/sync", requireApiKey("CRON_SECRET"), async (c) => {
    const traceId = c.get("traceId") as string;
    const repos = await db
      .select()
      .from(repository)
      .where(eq(repository.active, true))
      .all();

    let totalEnqueued = 0;
    let totalSkipped = 0;

    for (const repo of repos) {
      const result = await enqueueSync(repo.id, traceId);
      totalEnqueued += result.enqueued;
      totalSkipped += result.skipped;
    }

    return c.json({ success: true, enqueued: totalEnqueued, skipped: totalSkipped, traceId });
  })
  .post("/cleanup", requireApiKey("CRON_SECRET"), async (c) => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Delete old completed queue items
    const deletedQueue = await db
      .delete(syncQueue)
      .where(
        and(
          or(eq(syncQueue.status, "success"), eq(syncQueue.status, "failed")),
          lt(syncQueue.finishedAt, cutoff)
        )
      )
      .returning();

    // Delete old sync logs
    const deletedLogs = await db
      .delete(syncLog)
      .where(lt(syncLog.createdAt, cutoff))
      .returning();

    // Delete expired locks
    const deletedLocks = await db.delete(syncLock).where(lt(syncLock.expiresAt, new Date())).returning();

    // Delete expired or old retrieved secrets
    const deletedSecrets = await db
      .delete(syncSecret)
      .where(
        or(
          lt(syncSecret.expiresAt, new Date()),
          and(isNotNull(syncSecret.retrievedAt), lt(syncSecret.retrievedAt, cutoff))
        )
      )
      .returning();

    return c.json({
      success: true,
      deletedQueue: deletedQueue.length,
      deletedLogs: deletedLogs.length,
      deletedLocks: deletedLocks.length,
      deletedSecrets: deletedSecrets.length,
    });
  });
