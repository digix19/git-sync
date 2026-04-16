import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateIdFromEntropySize } from "lucia";
import { db } from "../db.js";
import { account } from "@gitsync/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware.js";
import { accountCreateSchema, providerSchema } from "@gitsync/shared/types";
import { encrypt } from "@gitsync/shared/crypto";
import { validatePat } from "../lib/pat.js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "";

export const accountsRouter = new Hono()
  .use(authMiddleware)
  .get("/", async (c) => {
    const u = c.get("user");
    const rows = await db.select().from(account).where(eq(account.userId, u.id)).all();
    return c.json({
      accounts: rows.map((a) => ({
        id: a.id,
        provider: a.provider,
        nickname: a.nickname,
        createdAt: a.createdAt,
      })),
    });
  })
  .post("/", zValidator("json", accountCreateSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");
    const valid = await validatePat(body.provider, body.pat);
    if (!valid) {
      return c.json({ error: "PAT validation failed" }, 400);
    }
    const encryptedPat = await encrypt(body.pat, ENCRYPTION_KEY);
    const id = generateIdFromEntropySize(16);
    await db.insert(account).values({
      id,
      userId: u.id,
      provider: body.provider,
      nickname: body.nickname,
      encryptedPat,
    });
    return c.json({ id }, 201);
  })
  .patch("/:id", zValidator("json", accountCreateSchema.partial()), async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const existing = await db
      .select()
      .from(account)
      .where(and(eq(account.id, id), eq(account.userId, u.id)))
      .get();
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    if (body.pat) {
      const valid = await validatePat(body.provider ?? existing.provider, body.pat);
      if (!valid) {
        return c.json({ error: "PAT validation failed" }, 400);
      }
    }
    const encryptedPat = body.pat ? await encrypt(body.pat, ENCRYPTION_KEY) : undefined;
    await db
      .update(account)
      .set({
        provider: body.provider ?? existing.provider,
        nickname: body.nickname ?? existing.nickname,
        encryptedPat: encryptedPat ?? existing.encryptedPat,
      })
      .where(eq(account.id, id));
    return c.json({ success: true });
  })
  .delete("/:id", async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    await db.delete(account).where(and(eq(account.id, id), eq(account.userId, u.id)));
    return c.json({ success: true });
  });
