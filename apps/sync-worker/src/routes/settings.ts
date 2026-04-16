import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateIdFromEntropySize } from "lucia";
import { db } from "../db.js";
import { setting } from "@gitsync/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware.js";
import { settingUpdateSchema } from "@gitsync/shared/types";

export const settingsRouter = new Hono()
  .use(authMiddleware)
  .get("/", async (c) => {
    const u = c.get("user");
    const row = await db.select().from(setting).where(eq(setting.userId, u.id)).get();
    return c.json({
      setting: row ?? null,
    });
  })
  .put("/", zValidator("json", settingUpdateSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");
    const existing = await db.select().from(setting).where(eq(setting.userId, u.id)).get();
    if (existing) {
      await db
        .update(setting)
        .set({
          telegramBotToken: body.telegramBotToken ?? existing.telegramBotToken,
          telegramChatId: body.telegramChatId ?? existing.telegramChatId,
          notifyOnFailure: body.notifyOnFailure ?? existing.notifyOnFailure,
          updatedAt: new Date(),
        })
        .where(eq(setting.id, existing.id));
    } else {
      const id = generateIdFromEntropySize(16);
      await db.insert(setting).values({
        id,
        userId: u.id,
        telegramBotToken: body.telegramBotToken,
        telegramChatId: body.telegramChatId,
        notifyOnFailure: body.notifyOnFailure,
      });
    }
    return c.json({ success: true });
  });
