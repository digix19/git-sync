# GitSync Executor Template

This folder contains a **reference implementation** of the GitSync executor. It is **not** a live GitHub Actions repository.

## How to use

1. Create a new public GitHub repository (e.g., `yourname/gitsync-executor`).
2. Copy `.github/workflows/sync.yml` from this folder into that repository.
3. Add the following secrets to the repository:
   - `EXECUTOR_API_KEY` — The same value as your sync-worker's `EXECUTOR_API_KEY`.
   - `API_BASE_URL` — The public URL of your sync-worker (e.g., `https://gitsync-worker.example.com`).
4. Enable the workflow. It will poll your worker every 5 minutes for pending sync jobs.

## Security

- The runner fetches plaintext PATs from the worker via an authenticated one-time endpoint.
- Secrets are masked in GitHub Actions logs using `::add-mask::`.
- PATs are never persisted in the runner or written to disk outside of the temporary git remote URL.
