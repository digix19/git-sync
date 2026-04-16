import { db } from "../db.js";
import {
  repository,
  destination,
  account,
  syncQueue,
  syncLock,
  syncLog,
  syncSecret,
} from "@gitsync/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@gitsync/shared/crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "";

export async function enqueueSync(
  repoId: string,
  traceId: string
): Promise<{ enqueued: number; skipped: number }> {
  const now = new Date();
  const repos = await db.select().from(repository).where(eq(repository.id, repoId)).all();
  if (repos.length === 0 || !repos[0]!.active) {
    return { enqueued: 0, skipped: 0 };
  }

  const dests = await db
    .select()
    .from(destination)
    .where(and(eq(destination.repositoryId, repoId), eq(destination.active, true)))
    .all();

  let enqueued = 0;
  let skipped = 0;

  for (const dest of dests) {
    // Check lock
    const lock = await db
      .select()
      .from(syncLock)
      .where(and(eq(syncLock.repositoryId, repoId), eq(syncLock.destinationId, dest.id)))
      .get();
    if (lock && lock.expiresAt > now) {
      skipped++;
      continue;
    }

    const jobId = crypto.randomUUID();

    // Remove old lock if any
    if (lock) {
      await db
        .delete(syncLock)
        .where(and(eq(syncLock.repositoryId, repoId), eq(syncLock.destinationId, dest.id)));
    }

    // Insert lock
    await db.insert(syncLock).values({
      repositoryId: repoId,
      destinationId: dest.id,
      jobId,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
    });

    // Insert queue
    await db.insert(syncQueue).values({
      id: jobId,
      repositoryId: repoId,
      destinationId: dest.id,
      status: "pending",
      traceId,
    });

    // Insert sync log
    await db.insert(syncLog).values({
      id: jobId,
      repositoryId: repoId,
      destinationId: dest.id,
      status: "pending",
      traceId,
    });

    enqueued++;
  }

  return { enqueued, skipped };
}

export async function getPendingJobs(limit: number) {
  const now = new Date();
  const rows = await db
    .select({
      queue: syncQueue,
      repo: repository,
      dest: destination,
      srcAccount: account,
    })
    .from(syncQueue)
    .innerJoin(repository, eq(syncQueue.repositoryId, repository.id))
    .innerJoin(destination, eq(syncQueue.destinationId, destination.id))
    .innerJoin(account, eq(repository.accountId, account.id))
    .where(eq(syncQueue.status, "pending"))
    .limit(limit)
    .all();

  const jobs = [];
  for (const row of rows) {
    const destAccount = await db
      .select()
      .from(account)
      .where(eq(account.id, row.dest.accountId))
      .get();
    if (!destAccount) continue;

    const sourcePat = await decrypt(row.srcAccount.encryptedPat, ENCRYPTION_KEY);
    const destPat = await decrypt(destAccount.encryptedPat, ENCRYPTION_KEY);

    // Write secrets with fresh 10-min expiry
    await db
      .insert(syncSecret)
      .values({
        jobId: row.queue.id,
        sourcePat,
        destPat,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      })
      .onConflictDoNothing();

    // Mark as running
    await db
      .update(syncQueue)
      .set({ status: "running", startedAt: now })
      .where(eq(syncQueue.id, row.queue.id));

    await db
      .update(syncLog)
      .set({ status: "running", startedAt: now })
      .where(eq(syncLog.id, row.queue.id));

    jobs.push({
      id: row.queue.id,
      sourceUrl: row.repo.url,
      destUrl: row.dest.url,
      traceId: row.queue.traceId,
      callbackUrl: `${process.env.API_BASE_URL}/api/sync/report`,
    });
  }

  return jobs;
}
