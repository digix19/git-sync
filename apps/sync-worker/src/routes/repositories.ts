import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateIdFromEntropySize } from "lucia";
import { db } from "../db.js";
import { repository, destination } from "@gitsync/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware.js";
import { repositoryCreateSchema } from "@gitsync/shared/types";

export const repositoriesRouter = new Hono()
  .use(authMiddleware)
  .get("/", async (c) => {
    const u = c.get("user");
    const rows = await db.select().from(repository).where(eq(repository.userId, u.id)).all();
    return c.json({ repositories: rows });
  })
  .post("/", zValidator("json", repositoryCreateSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");
    const id = generateIdFromEntropySize(16);
    await db.insert(repository).values({
      id,
      userId: u.id,
      accountId: body.accountId,
      url: body.url,
      active: body.active,
    });
    return c.json({ id }, 201);
  })
  .patch("/:id", zValidator("json", repositoryCreateSchema.partial()), async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const existing = await db
      .select()
      .from(repository)
      .where(and(eq(repository.id, id), eq(repository.userId, u.id)))
      .get();
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    await db
      .update(repository)
      .set({
        accountId: body.accountId ?? existing.accountId,
        url: body.url ?? existing.url,
        active: body.active ?? existing.active,
      })
      .where(eq(repository.id, id));
    return c.json({ success: true });
  })
  .delete("/:id", async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    await db
      .delete(repository)
      .where(and(eq(repository.id, id), eq(repository.userId, u.id)));
    return c.json({ success: true });
  });
