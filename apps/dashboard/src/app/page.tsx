"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Nav from "@/components/Nav";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!user) return null;

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-700">Welcome back, {user.email}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <a href="/accounts" className="block p-4 bg-white rounded shadow hover:shadow-md">
            <h2 className="font-semibold">Accounts</h2>
            <p className="text-sm text-gray-500">Manage git provider accounts and PATs</p>
          </a>
          <a href="/repositories" className="block p-4 bg-white rounded shadow hover:shadow-md">
            <h2 className="font-semibold">Repositories</h2>
            <p className="text-sm text-gray-500">Configure source repositories</p>
          </a>
          <a href="/logs" className="block p-4 bg-white rounded shadow hover:shadow-md">
            <h2 className="font-semibold">Sync Logs</h2>
            <p className="text-sm text-gray-500">View mirror history and status</p>
          </a>
        </div>
      </main>
    </>
  );
}
