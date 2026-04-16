"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Nav from "@/components/Nav";

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({ telegramBotToken: "", telegramChatId: "", notifyOnFailure: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/settings")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data.setting) {
          setForm({
            telegramBotToken: data.setting.telegramBotToken || "",
            telegramChatId: data.setting.telegramChatId || "",
            notifyOnFailure: data.setting.notifyOnFailure,
          });
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      alert("Failed to save settings");
      return;
    }
    alert("Settings saved");
  }

  if (loading) return null;

  return (
    <>
      <Nav />
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <form onSubmit={save} className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Telegram Bot Token</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={form.telegramBotToken}
              onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telegram Chat ID</label>
            <input
              name="chatId"
              className="w-full border px-3 py-2 rounded"
              value={form.telegramChatId}
              onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.notifyOnFailure}
              onChange={(e) => setForm({ ...form, notifyOnFailure: e.target.checked })}
            />
            <span className="text-sm">Notify on failure</span>
          </label>
          <button className="bg-black text-white px-4 py-2 rounded">Save Settings</button>
        </form>
      </main>
    </>
  );
}
