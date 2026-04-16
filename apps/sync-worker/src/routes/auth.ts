import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { generateIdFromEntropySize } from "lucia";
import { db } from "../db.js";
import { lucia } from "../auth.js";
import { hashPassword, verifyPassword } from "@gitsync/shared/password";
import { user } from "@gitsync/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const existing = await db.select().from(user).where(eq(user.email, email)).get();
    if (existing) {
      return c.json({ error: "Email already in use" }, 409);
    }
    const id = generateIdFromEntropySize(16);
    const passwordHash = await hashPassword(password);
    await db.insert(user).values({ id, email, passwordHash });
    const session = await lucia.createSession(id, {});
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    return c.json({ user: { id, email } }, 201);
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const existing = await db.select().from(user).where(eq(user.email, email)).get();
    if (!existing) {
      return c.json({ error: "Invalid credentials" }, 400);
    }
    const valid = await verifyPassword(password, existing.passwordHash);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 400);
    }
    const session = await lucia.createSession(existing.id, {});
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    return c.json({ user: { id: existing.id, email: existing.email } });
  })
  .post("/logout", authMiddleware, async (c) => {
    const session = c.get("session");
    if (session) {
      await lucia.invalidateSession(session.id);
      c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    }
    return c.json({ success: true });
  })
  .get("/me", authMiddleware, async (c) => {
    const u = c.get("user");
    return c.json({ user: { id: u.id, email: u.email } });
  });
