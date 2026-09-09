"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!response.ok) {
        setMessage("Invalid email or password.");
        return;
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);

router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">
            Lead Scraper
          </h1>

          <p className="mt-2 text-zinc-500">
            Sign in to manage your leads
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        {message && (
          <p className="mt-5 text-center text-sm text-zinc-600">
            {message}
          </p>
        )}

      </div>
    </main>
  );
}