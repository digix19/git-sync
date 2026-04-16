"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed");
      return;
    }
    router.push("/");
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-black text-white py-2 rounded">Register</button>
      </form>
      <p className="text-sm mt-4 text-center">
        Already have an account? <a href="/login" className="underline">Login</a>
      </p>
    </div>
  );
}
