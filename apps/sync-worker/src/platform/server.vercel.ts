import app from "../index.js";

// Vercel Edge Function handler
export default async function handler(request: Request): Promise<Response> {
  return app.fetch(request);
}
