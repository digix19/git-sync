import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { resolveDbUrl } from "./resolve.js";

export type Database = LibSQLDatabase<typeof schema>;

export function createDbClient(url: string, authToken?: string): Database {
  const resolvedUrl = resolveDbUrl(url);
  const client: Client = createClient({ url: resolvedUrl, authToken });
  return drizzle(client, { schema });
}
