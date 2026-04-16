import { createDbClient } from "@gitsync/db/client";

export const db = createDbClient(
  process.env.DATABASE_URL ?? "",
  process.env.DATABASE_AUTH_TOKEN
);
