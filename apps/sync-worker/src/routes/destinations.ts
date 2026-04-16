import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateIdFromEntropySize } from "lucia";
import { db } from "../db.js";
import { destination, repository } from "@gitsync/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware.js";
import { destinationCreateSchema } from "@gitsync/shared/types";

export const destinationsRouter = new Hono()
  .use(authMiddleware)
  .get("/", async (c) => {
    const u = c.get("user");
    const repoId = c.req.query("repositoryId");
    let query = db.select({ dest: destination }).from(destination).innerJoin(repository, eq(destination.repositoryId, repository.id));
    query = query.where(eq(repository.userId, u.id)) as typeof query;
    if (repoId) {
      query = query.where(and(eq(repository.userId, u.id), eq(destination.repositoryId, repoId))) as typeof query;
    }
    const rows = await query.all();
    return c.json({ destinations: rows.map((r) => r.dest) });
  })
  .post("/", zValidator("json", destinationCreateSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");
    // Verify repo ownership
    const repo = await db
      .select()
      .from(repository)
      .where(and(eq(repository.id, body.repositoryId), eq(repository.userId, u.id)))
      .get();
    if (!repo) {
      return c.json({ error: "Repository not found" }, 404);
    }
    const id = generateIdFromEntropySize(16);
    await db.insert(destination).values({
      id,
      repositoryId: body.repositoryId,
      accountId: body.accountId,
      url: body.url,
      active: body.active,
    });
    return c.json({ id }, 201);
  })
  .patch("/:id", zValidator("json", destinationCreateSchema.partial()), async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const existing = await db
      .select({ dest: destination })
      .from(destination)
      .innerJoin(repository, eq(destination.repositoryId, repository.id))
      .where(and(eq(destination.id, id), eq(repository.userId, u.id)))
      .get();
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    await db
      .update(destination)
      .set({
        accountId: body.accountId ?? existing.dest.accountId,
        url: body.url ?? existing.dest.url,
        active: body.active ?? existing.dest.active,
      })
      .where(eq(destination.id, id));
    return c.json({ success: true });
  })
  .delete("/:id", async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const existing = await db
      .select({ dest: destination })
      .from(destination)
      .innerJoin(repository, eq(destination.repositoryId, repository.id))
      .where(and(eq(destination.id, id), eq(repository.userId, u.id)))
      .get();
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    await db.delete(destination).where(eq(destination.id, id));
    return c.json({ success: true });
  });
