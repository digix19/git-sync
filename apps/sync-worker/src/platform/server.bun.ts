import app from "../index.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

console.log(`Sync worker starting on http://${host}:${port}`);

Bun.serve({
  port,
  hostname: host,
  fetch: app.fetch,
});
