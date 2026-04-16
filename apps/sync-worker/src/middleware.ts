import { createMiddleware } from "hono/factory";
import { cors } from "hono/cors";
import type { Context, Next } from "hono";
import { lucia } from "./auth.js";

export const traceMiddleware = createMiddleware(async (c, next) => {
  const traceId = crypto.randomUUID();
  c.set("traceId", traceId);
  c.header("X-Trace-Id", traceId);
  await next();
});

export const logMiddleware = createMiddleware(async (c, next) => {
  const start = performance.now();
  await next();
  const duration = Math.round(performance.now() - start);
  const log = {
    traceId: c.get("traceId") as string,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: duration,
    userAgent: c.req.header("user-agent"),
  };
  console.log(JSON.stringify(log));
});

export const corsMiddleware = cors({
  origin: process.env.DASHBOARD_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:3000",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

export const authMiddleware = createMiddleware(async (c, next) => {
  const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "");
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (session.fresh) {
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }
  c.set("user", user);
  c.set("session", session);
  await next();
});

export function requireApiKey(envKey: string) {
  return createMiddleware(async (c, next) => {
    const auth = c.req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const expected = process.env[envKey];
    if (!expected || token !== expected) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  });
}
