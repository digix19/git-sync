import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "number" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // github, gitlab, gitea, bitbucket, other
  nickname: text("nickname").notNull(),
  encryptedPat: text("encrypted_pat").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const repository = sqliteTable("repository", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id")
    .notNull()
    .references(() => account.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const destination = sqliteTable("destination", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id")
    .notNull()
    .references(() => repository.id, { onDelete: "cascade" }),
  accountId: text("account_id")
    .notNull()
    .references(() => account.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const syncLog = sqliteTable("sync_log", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id")
    .notNull()
    .references(() => repository.id, { onDelete: "cascade" }),
  destinationId: text("destination_id")
    .notNull()
    .references(() => destination.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // pending, running, success, failed
  traceId: text("trace_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  errorMessage: text("error_message"),
  output: text("output"),
});

export const syncQueue = sqliteTable("sync_queue", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id")
    .notNull()
    .references(() => repository.id, { onDelete: "cascade" }),
  destinationId: text("destination_id")
    .notNull()
    .references(() => destination.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // pending, running, success, failed
  traceId: text("trace_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  errorMessage: text("error_message"),
});

export const syncLock = sqliteTable(
  "sync_lock",
  {
    repositoryId: text("repository_id").notNull(),
    destinationId: text("destination_id").notNull(),
    jobId: text("job_id").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.repositoryId, t.destinationId] })]
);

export const syncSecret = sqliteTable("sync_secret", {
  jobId: text("job_id").primaryKey(),
  sourcePat: text("source_pat").notNull(),
  destPat: text("dest_pat").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  retrievedAt: integer("retrieved_at", { mode: "timestamp_ms" }),
});

export const setting = sqliteTable("setting", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  notifyOnFailure: integer("notify_on_failure", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  repositories: many(repository),
  setting: one(setting),
}));

export const accountRelations = relations(account, ({ one, many }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
  repositories: many(repository),
  destinations: many(destination),
}));

export const repositoryRelations = relations(repository, ({ one, many }) => ({
  user: one(user, { fields: [repository.userId], references: [user.id] }),
  account: one(account, { fields: [repository.accountId], references: [account.id] }),
  destinations: many(destination),
  syncLogs: many(syncLog),
  syncQueues: many(syncQueue),
}));

export const destinationRelations = relations(destination, ({ one, many }) => ({
  repository: one(repository, { fields: [destination.repositoryId], references: [repository.id] }),
  account: one(account, { fields: [destination.accountId], references: [account.id] }),
  syncLogs: many(syncLog),
  syncQueues: many(syncQueue),
}));
