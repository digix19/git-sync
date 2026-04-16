import app from "../index.js";

const port = Number(process.env.PORT ?? 8787);

console.log(`Sync worker starting on http://localhost:${port}`);

Bun.serve({
  port,
  fetch: app.fetch,
});
