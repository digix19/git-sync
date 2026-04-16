"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Nav from "@/components/Nav";

const PROVIDERS = ["github", "gitlab", "gitea", "bitbucket", "other"];

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ provider: "github", nickname: "", pat: "" });

  useEffect(() => {
    apiFetch("/api/accounts")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setAccounts(data.accounts);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/accounts", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      alert("Failed to add account");
      return;
    }
    setForm({ provider: "github", nickname: "", pat: "" });
    const data = await apiFetch("/api/accounts").then((r) => r.json());
    setAccounts(data.accounts);
  }

  async function remove(id: string) {
    if (!confirm("Delete this account?")) return;
    await apiFetch(`/api/accounts/${id}`, { method: "DELETE" });
    setAccounts((a) => a.filter((x) => x.id !== id));
  }

  if (loading) return null;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Accounts</h1>
        <form onSubmit={add} className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <div className="flex gap-3">
            <select
              className="border px-3 py-2 rounded"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              placeholder="Nickname"
              className="flex-1 border px-3 py-2 rounded"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              required
            />
          </div>
          <input
            type="password"
            placeholder="Personal Access Token"
            className="w-full border px-3 py-2 rounded"
            value={form.pat}
            onChange={(e) => setForm({ ...form, pat: e.target.value })}
            required
          />
          <button className="bg-black text-white px-4 py-2 rounded">Add Account</button>
        </form>

        <ul className="space-y-3">
          {accounts.map((a) => (
            <li key={a.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-semibold">{a.nickname}</p>
                <p className="text-sm text-gray-500 capitalize">{a.provider}</p>
              </div>
              <button onClick={() => remove(a.id)} className="text-red-600 text-sm hover:underline">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
