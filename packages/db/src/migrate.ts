import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDbUrl } from "./resolve.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient({ url: resolveDbUrl(url), authToken });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: join(__dirname, "..", "migrations") });
  console.log("Migrations applied successfully");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
