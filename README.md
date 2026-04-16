# GitSync

A **cloud-agnostic git repository mirror management system**. Automatically clone `--mirror` and push `--mirror` across providers without maintaining a VPS or modifying source code.

## Architecture Overview

| Component | Tech |
|-----------|------|
| Dashboard | Next.js 15 (static export), React 19, Tailwind CSS 4 |
| Sync Worker | Hono 4 (cross-runtime: Bun, Node, Cloudflare Workers, Vercel) |
| Database | Turso / libSQL (swappable to any SQLite-compatible server) |
| Auth | Lucia Auth v3 with scrypt password hashing |
| Encryption | AES-GCM-256 (Web Crypto API) |
| Executor | GitHub Actions polling workflow |

## Local Development

### 1. Clone & Install

```bash
git clone https://github.com/digix19/git-sync.git
cd git-sync
bun install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if needed. The defaults use a local SQLite file and run the API on `http://localhost:8787`.

### 3. Database

```bash
# Apply migrations
bun run packages/db/src/migrate.ts
```

### 4. Run Everything

From the repo root:

```bash
# Load env vars and start both services
set -a && source .env.local && set +a && bun run dev
```

This starts:
- **Sync Worker** at `http://localhost:8787`
- **Dashboard** at `http://localhost:3000`

If port `3000` is busy, Next.js will automatically try the next available port.

### 5. Register & Use

1. Open `http://localhost:3000/register`
2. Create an account
3. Add a git provider account (PAT) at `/accounts`
4. Add a source repository at `/repositories`
5. Add a destination at `/destinations`
6. Click **Sync Now** or wait for the cron trigger

## Deployment

### Sync Worker

Build and run on any Bun or Node host:

```bash
# Bun
PORT=8787 bun run apps/sync-worker/src/platform/server.bun.ts

# Node
PORT=8787 node --experimental-strip-types apps/sync-worker/src/platform/server.node.ts
```

### Dashboard

The dashboard is a static export:

```bash
cd apps/dashboard
bun run build
```

Deploy the `out/` directory to Vercel, Netlify, Cloudflare Pages, or any static host.

### Cron Triggers

Two options:

1. **System cron** (VPS): see `crontab.txt`
2. **GitHub Actions**: use `.github/workflows/cron.yml` in your own repo

### Executor

The GitHub Actions executor lives in a separate public repository. See `executor-template/` for the reference workflow and setup instructions.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | libSQL URL (e.g., `file:./local.db` or `libsql://...turso.io`) |
| `DATABASE_AUTH_TOKEN` | Turso auth token (optional for local file) |
| `ENCRYPTION_KEY` | 64-char hex AES-GCM key |
| `WORKER_SECRET` | HMAC key for callbacks |
| `EXECUTOR_API_KEY` | API key for the GitHub Actions executor |
| `CRON_SECRET` | Secret for protecting cron endpoints |
| `API_BASE_URL` | Public URL of the sync-worker |
| `NEXT_PUBLIC_API_BASE_URL` | Dashboard API target |

## Security Model

- PATs are encrypted at rest with AES-GCM-256.
- They are decrypted only inside the sync worker.
- Ephemeral plaintext PATs are exposed via a one-time HTTP endpoint (`/api/sync/secrets`) with a 10-minute expiry.
- Executor callbacks are HMAC-SHA256 signed and time-bounded.
- Passwords are hashed with scrypt (via `@noble/hashes`).

## License

MIT
