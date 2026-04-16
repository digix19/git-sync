import { resolve, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function findMonorepoRoot(start: string): string {
  let dir = start;
  while (dir !== "/") {
    try {
      const pkg = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf-8"));
      if (pkg.name === "git-sync") return dir;
    } catch {
      // ignore
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function resolveDbUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const path = url.slice(5);
  if (path.startsWith("/")) return url; // absolute
  const root = findMonorepoRoot(dirname(fileURLToPath(import.meta.url)));
  return `file:${resolve(root, path)}`;
}
