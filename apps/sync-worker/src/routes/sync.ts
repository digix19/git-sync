import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db.js";
import { authMiddleware, requireApiKey } from "../middleware.js";
import { enqueueSync, getPendingJobs } from "../lib/sync.js";
import { syncQueue, syncLock, syncLog, syncSecret } from "@gitsync/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { verify } from "@gitsync/shared/hmac";
import { repository, destination } from "@gitsync/db/schema";

const triggerSchema = z.object({
  repositoryId: z.string().min(1),
});

const pollSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

const secretsSchema = z.object({
  jobId: z.string().min(1),
});

const reportSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["success", "failed"]),
  output: z.string().optional(),
  errorMessage: z.string().optional(),
});

const WORKER_SECRET = process.env.WORKER_SECRET ?? "";

export const syncRouter = new Hono()
  .get("/logs", authMiddleware, async (c) => {
    const u = c.get("user");
    const rows = await db
      .select({
        id: syncLog.id,
        status: syncLog.status,
        traceId: syncLog.traceId,
        createdAt: syncLog.createdAt,
        finishedAt: syncLog.finishedAt,
        errorMessage: syncLog.errorMessage,
      })
      .from(syncLog)
      .innerJoin(repository, eq(syncLog.repositoryId, repository.id))
      .where(eq(repository.userId, u.id))
      .orderBy(syncLog.createdAt)
      .all();
    return c.json({ logs: rows });
  })
  // Manual trigger
  .post("/", authMiddleware, zValidator("json", triggerSchema), async (c) => {
    const { repositoryId } = c.req.valid("json");
    // Verify ownership
    const repo = await db
      .select()
      .from(repository)
      .where(and(eq(repository.id, repositoryId), eq(repository.userId, c.get("user").id)))
      .get();
    if (!repo) {
      return c.json({ error: "Repository not found" }, 404);
    }
    const traceId = c.get("traceId") as string;
    const result = await enqueueSync(repositoryId, traceId);
    return c.json({ success: true, traceId, ...result });
  })
  // Executor poll
  .post("/poll", requireApiKey("EXECUTOR_API_KEY"), zValidator("json", pollSchema), async (c) => {
    const { limit } = c.req.valid("json");
    const jobs = await getPendingJobs(limit);
    return c.json(jobs);
  })
  // Executor fetch secrets
  .post("/secrets", requireApiKey("EXECUTOR_API_KEY"), zValidator("json", secretsSchema), async (c) => {
    const { jobId } = c.req.valid("json");
    const now = new Date();
    const row = await db.select().from(syncSecret).where(eq(syncSecret.jobId, jobId)).get();
    if (!row || row.expiresAt < now || row.retrievedAt) {
      return c.json({ error: "Secret not available" }, 404);
    }
    await db
      .update(syncSecret)
      .set({ retrievedAt: now })
      .where(eq(syncSecret.jobId, jobId));
    return c.json({ sourcePat: row.sourcePat, destPat: row.destPat });
  })
  // Executor report
  .post("/report", zValidator("json", reportSchema), async (c) => {
    const body = c.req.valid("json");
    const signature = c.req.header("X-Signature") ?? "";
    const timestamp = c.req.header("X-Timestamp") ?? "";
    const maxAge = 15 * 60 * 1000; // 15 minutes
    const tsNum = Number(timestamp) * 1000;
    if (!timestamp || Number.isNaN(tsNum) || Date.now() - tsNum > maxAge) {
      return c.json({ error: "Expired or invalid timestamp" }, 403);
    }
    const valid = await verify(`${body.jobId}${timestamp}`, signature, WORKER_SECRET);
    if (!valid) {
      return c.json({ error: "Invalid signature" }, 403);
    }

    const now = new Date();
    await db
      .update(syncQueue)
      .set({
        status: body.status,
        finishedAt: now,
        errorMessage: body.errorMessage,
      })
      .where(eq(syncQueue.id, body.jobId));

    await db
      .update(syncLog)
      .set({
        status: body.status,
        finishedAt: now,
        errorMessage: body.errorMessage,
        output: body.output,
      })
      .where(eq(syncLog.id, body.jobId));

    // Release lock
    const queueItem = await db.select().from(syncQueue).where(eq(syncQueue.id, body.jobId)).get();
    if (queueItem) {
      await db
        .delete(syncLock)
        .where(
          and(
            eq(syncLock.repositoryId, queueItem.repositoryId),
            eq(syncLock.destinationId, queueItem.destinationId)
          )
        );
    }

    // TODO: Telegram notification on failure
    return c.json({ success: true });
  });
