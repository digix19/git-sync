import { createServer } from "node:http";
import app from "../index.js";

const port = Number(process.env.PORT ?? 8787);

console.log(`Sync worker starting on http://localhost:${port}`);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v !== undefined) {
      headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
  }

  let body: Uint8Array | undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length > 0) {
    body = new Uint8Array(Buffer.concat(chunks));
  }

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}).listen(port);
