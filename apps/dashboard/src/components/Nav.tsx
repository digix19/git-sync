"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function Nav() {
  const router = useRouter();

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="border-b bg-white px-6 py-3 flex items-center gap-6">
      <Link href="/" className="font-bold text-lg">
        GitSync
      </Link>
      <Link href="/accounts" className="text-sm text-gray-700 hover:underline">
        Accounts
      </Link>
      <Link href="/repositories" className="text-sm text-gray-700 hover:underline">
        Repositories
      </Link>
      <Link href="/destinations" className="text-sm text-gray-700 hover:underline">
        Destinations
      </Link>
      <Link href="/logs" className="text-sm text-gray-700 hover:underline">
        Logs
      </Link>
      <Link href="/settings" className="text-sm text-gray-700 hover:underline">
        Settings
      </Link>
      <div className="flex-1" />
      <button onClick={logout} className="text-sm text-red-600 hover:underline">
        Logout
      </button>
    </nav>
  );
}
