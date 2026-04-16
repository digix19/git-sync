import { z } from "zod";

export const providerSchema = z.enum(["github", "gitlab", "gitea", "bitbucket", "other"]);
export type Provider = z.infer<typeof providerSchema>;

export const syncStatusSchema = z.enum(["pending", "running", "success", "failed"]);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export const accountCreateSchema = z.object({
  provider: providerSchema,
  nickname: z.string().min(1).max(64),
  pat: z.string().min(1),
});

export const repositoryCreateSchema = z.object({
  accountId: z.string().min(1),
  url: z.string().url(),
  active: z.boolean().default(true),
});

export const destinationCreateSchema = z.object({
  repositoryId: z.string().min(1),
  accountId: z.string().min(1),
  url: z.string().url(),
  active: z.boolean().default(true),
});

export const settingUpdateSchema = z.object({
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
  notifyOnFailure: z.boolean().default(true),
});
