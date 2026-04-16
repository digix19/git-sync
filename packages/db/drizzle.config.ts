import { defineConfig } from "drizzle-kit";
import { resolveDbUrl } from "./src/resolve.js";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: resolveDbUrl(process.env.DATABASE_URL ?? "file:./local.db"),
  },
});
