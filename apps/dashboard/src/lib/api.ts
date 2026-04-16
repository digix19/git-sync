const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return res;
}
