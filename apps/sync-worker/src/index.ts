import "./types.js";
import { Hono } from "hono";
import { traceMiddleware, logMiddleware, corsMiddleware } from "./middleware.js";
import { authRouter } from "./routes/auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { repositoriesRouter } from "./routes/repositories.js";
import { destinationsRouter } from "./routes/destinations.js";
import { settingsRouter } from "./routes/settings.js";
import { syncRouter } from "./routes/sync.js";
import { cronRouter } from "./routes/cron.js";

const app = new Hono();

app.use(corsMiddleware);
app.use(traceMiddleware);
app.use(logMiddleware);

app.get("/health", (c) => c.json({ ok: true, traceId: c.get("traceId") }));

app.route("/api/auth", authRouter);
app.route("/api/accounts", accountsRouter);
app.route("/api/repositories", repositoriesRouter);
app.route("/api/destinations", destinationsRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/sync", syncRouter);
app.route("/api/cron", cronRouter);

export default app;
