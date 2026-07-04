"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { motion } from "motion/react";

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Authentication failed! Try again.");
      }

      const data = await res.json();
      login(data.access_token, data.user);
      router.push("/forge");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("ganeshhanuman77@gmail.com");
    setPassword("DemoAspirant2026!");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ganeshhanuman77@gmail.com", password: "DemoAspirant2026!" }),
      });

      if (!res.ok) {
        throw new Error("Authentication failed! Try again.");
      }

      const data = await res.json();
      login(data.access_token, data.user);
      router.push("/forge");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 flex items-center justify-center bg-[var(--color-c-light)] relative overflow-hidden z-0">
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--color-c-yellow)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-bounce -z-10" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[var(--color-c-cyan)] rounded-xl border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-spin-slow transform rotate-12 -z-10" style={{ animationDuration: '15s' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 50, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="comic-panel p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight mb-2 drop-shadow-[2px_2px_0_var(--color-c-cyan)]">Welcome Back!</h1>
            <p className="text-[var(--color-c-dark)] font-bold bg-[var(--color-c-yellow)] inline-block px-3 py-1 border-2 border-[var(--color-c-dark)] rounded-lg shadow-[2px_2px_0_var(--color-c-dark)] transform -rotate-1">Login to deploy agents</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-[var(--color-c-red)] text-white border-4 border-[var(--color-c-dark)] rounded-xl font-black text-center shadow-[4px_4px_0_var(--color-c-dark)] animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-wider text-[var(--color-c-dark)] ml-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-c-dark)]">
                  <FiMail size={18} />
                </div>
                <input
                  type="email"
                  className="comic-input w-full pl-11 pr-4 py-3 bg-gray-50 text-[var(--color-c-dark)] placeholder:text-gray-400"
                  placeholder="hero@vidyavibe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-wider text-[var(--color-c-dark)] ml-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-c-dark)]">
                  <FiLock size={18} />
                </div>
                <input
                  type="password"
                  className="comic-input w-full pl-11 pr-4 py-3 bg-gray-50 text-[var(--color-c-dark)] placeholder:text-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="comic-button flex-1 py-4 bg-[var(--color-c-green)] text-[var(--color-c-dark)] flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "BOOM! Login"} <FiArrowRight size={20} />
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="comic-button flex-1 py-4 bg-[var(--color-c-yellow)] text-[var(--color-c-dark)] flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                Demo Login
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t-4 border-[var(--color-c-dark)] pt-6 border-dashed">
            <p className="text-[var(--color-c-dark)] font-bold">
              New here?{" "}
              <Link href="/register" className="text-[var(--color-c-blue)] font-black hover:underline decoration-4 underline-offset-4">
                Create an account!
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
