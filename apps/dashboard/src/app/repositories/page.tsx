"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Nav from "@/components/Nav";

export default function RepositoriesPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ accountId: "", url: "" });

  useEffect(() => {
    Promise.all([apiFetch("/api/repositories"), apiFetch("/api/accounts")])
      .then(async ([r1, r2]) => {
        if (!r1.ok || !r2.ok) throw new Error("Unauthorized");
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        setRepos(d1.repositories);
        setAccounts(d2.accounts);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/repositories", {
      method: "POST",
      body: JSON.stringify({ ...form, active: true }),
    });
    if (!res.ok) {
      alert("Failed to add repository");
      return;
    }
    setForm({ accountId: "", url: "" });
    const data = await apiFetch("/api/repositories").then((r) => r.json());
    setRepos(data.repositories);
  }

  async function remove(id: string) {
    if (!confirm("Delete this repository?")) return;
    await apiFetch(`/api/repositories/${id}`, { method: "DELETE" });
    setRepos((r) => r.filter((x) => x.id !== id));
  }

  async function sync(id: string) {
    const res = await apiFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({ repositoryId: id }),
    });
    if (!res.ok) {
      alert("Failed to trigger sync");
      return;
    }
    alert("Sync triggered");
  }

  if (loading) return null;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Repositories</h1>
        <form onSubmit={add} className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <div className="flex gap-3">
            <select
              className="border px-3 py-2 rounded"
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              required
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname}
                </option>
              ))}
            </select>
            <input
              placeholder="Source URL"
              className="flex-1 border px-3 py-2 rounded"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </div>
          <button className="bg-black text-white px-4 py-2 rounded">Add Repository</button>
        </form>

        <ul className="space-y-3">
          {repos.map((r) => (
            <li key={r.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-semibold truncate max-w-md">{r.url}</p>
                <p className="text-sm text-gray-500">{r.active ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => sync(r.id)} className="text-blue-600 text-sm hover:underline">
                  Sync Now
                </button>
                <button onClick={() => remove(r.id)} className="text-red-600 text-sm hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
