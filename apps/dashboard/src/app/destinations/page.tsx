"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Nav from "@/components/Nav";

export default function DestinationsPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ repositoryId: "", accountId: "", url: "" });

  useEffect(() => {
    Promise.all([
      apiFetch("/api/destinations"),
      apiFetch("/api/repositories"),
      apiFetch("/api/accounts"),
    ])
      .then(async ([r1, r2, r3]) => {
        if (!r1.ok || !r2.ok || !r3.ok) throw new Error("Unauthorized");
        const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        setDestinations(d1.destinations);
        setRepos(d2.repositories);
        setAccounts(d3.accounts);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/destinations", {
      method: "POST",
      body: JSON.stringify({ ...form, active: true }),
    });
    if (!res.ok) {
      alert("Failed to add destination");
      return;
    }
    setForm({ repositoryId: "", accountId: "", url: "" });
    const data = await apiFetch("/api/destinations").then((r) => r.json());
    setDestinations(data.destinations);
  }

  async function remove(id: string) {
    if (!confirm("Delete this destination?")) return;
    await apiFetch(`/api/destinations/${id}`, { method: "DELETE" });
    setDestinations((d) => d.filter((x) => x.id !== id));
  }

  if (loading) return null;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Destinations</h1>
        <form onSubmit={add} className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <div className="flex gap-3">
            <select
              className="border px-3 py-2 rounded"
              value={form.repositoryId}
              onChange={(e) => setForm({ ...form, repositoryId: e.target.value })}
              required
            >
              <option value="">Select repository</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.url}
                </option>
              ))}
            </select>
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
          </div>
          <input
            placeholder="Destination URL"
            className="w-full border px-3 py-2 rounded"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
          />
          <button className="bg-black text-white px-4 py-2 rounded">Add Destination</button>
        </form>

        <ul className="space-y-3">
          {destinations.map((d) => {
            const repo = repos.find((r) => r.id === d.repositoryId);
            return (
              <li key={d.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold truncate max-w-md">{d.url}</p>
                  <p className="text-sm text-gray-500">{repo ? repo.url : d.repositoryId}</p>
                </div>
                <button onClick={() => remove(d.id)} className="text-red-600 text-sm hover:underline">
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
