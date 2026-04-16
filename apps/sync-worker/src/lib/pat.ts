/**
 * Lightweight PAT validation against git provider APIs.
 */

export async function validatePat(provider: string, pat: string): Promise<boolean> {
  try {
    switch (provider) {
      case "github": {
        const res = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" },
        });
        return res.status === 200;
      }
      case "gitlab": {
        const res = await fetch("https://gitlab.com/api/v4/user", {
          headers: { "PRIVATE-TOKEN": pat },
        });
        return res.status === 200;
      }
      case "gitea": {
        // Gitea instances vary; skip generic validation
        return true;
      }
      case "bitbucket": {
        // Bitbucket uses app passwords; skip generic validation
        return true;
      }
      default:
        return true;
    }
  } catch {
    return false;
  }
}
