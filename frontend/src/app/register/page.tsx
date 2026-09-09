"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/config/api";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password and confirm password do not match.");
      return false;
    }

    return true;
  };

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Submit RegisterRequest to /api/auth/register
      const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!registerRes.ok) {
        let message = "Registration failed. Please check your input.";
        try {
          const errorData = await registerRes.json();
          if (errorData.message) {
            message = errorData.message;
          } else if (typeof errorData === "string") {
            message = errorData;
          }
        } catch (_) {}
        setErrorMessage(message);
        return;
      }

      // 2. Attempt Auto-Login with newly registered credentials
      try {
        const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("userEmail", email.trim());
          router.push("/dashboard");
          return;
        }
      } catch (loginError) {
        console.error("Auto-login error after registration:", loginError);
      }

      // 3. Fallback: Redirect to login page with success notification
      router.push("/?registered=true");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">
            Create Account
          </h1>
          <p className="mt-2 text-zinc-500">
            Sign up to start finding and discovering leads
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 outline-none focus:border-zinc-500 text-sm text-zinc-900"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 outline-none focus:border-zinc-500 text-sm text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 outline-none focus:border-zinc-500 text-sm text-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 outline-none focus:border-zinc-500 text-sm text-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 outline-none focus:border-zinc-500 text-sm text-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 text-sm"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-5 text-center text-sm text-rose-600 font-medium">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 text-center text-sm text-zinc-600 pt-4 border-t border-zinc-100">
          Already have an account?{" "}
          <Link href="/" className="font-semibold text-black hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
