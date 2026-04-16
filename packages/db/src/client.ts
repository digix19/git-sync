import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

export type Database = LibSQLDatabase<typeof schema>;

export function createDbClient(url: string, authToken?: string): Database {
  const client: Client = createClient({ url, authToken });
  return drizzle(client, { schema });
}
