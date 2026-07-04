"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowRight, FiUser, FiMail, FiLock, FiPhone } from "react-icons/fi";
import { motion } from "motion/react";

export default function Register() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Registration failed!");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 pb-20 flex items-center justify-center bg-[var(--color-c-light)] relative overflow-hidden z-0">
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--color-c-cyan)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-bounce -z-10" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[var(--color-c-yellow)] rounded-xl border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-spin-slow transform rotate-12 -z-10" style={{ animationDuration: '15s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10 my-8"
      >
        <div className="comic-panel p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight mb-2 drop-shadow-[2px_2px_0_var(--color-c-yellow)]">Join the Squad!</h1>
            <p className="text-[var(--color-c-dark)] font-bold bg-[var(--color-c-cyan)] inline-block px-3 py-1 border-2 border-[var(--color-c-dark)] rounded-lg shadow-[2px_2px_0_var(--color-c-dark)] transform rotate-1">Create your agentic account</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 bg-[var(--color-c-orange)] text-[var(--color-c-dark)] border-4 border-[var(--color-c-dark)] rounded-xl font-black text-center shadow-[4px_4px_0_var(--color-c-dark)] animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-black uppercase tracking-wider text-[var(--color-c-dark)] ml-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-c-dark)]">
                  <FiUser size={18} />
                </div>
                <input
                  type="text"
                  name="full_name"
                  className="comic-input w-full pl-11 pr-4 py-3 bg-gray-50 text-[var(--color-c-dark)] placeholder:text-gray-400"
                  placeholder="Super Hero"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black uppercase tracking-wider text-[var(--color-c-dark)] ml-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-c-dark)]">
                  <FiMail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  className="comic-input w-full pl-11 pr-4 py-3 bg-gray-50 text-[var(--color-c-dark)] placeholder:text-gray-400"
                  placeholder="hero@vidyavibe.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black uppercase tracking-wider text-[var(--color-c-dark)] ml-2">Phone (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-c-dark)]">
                  <FiPhone size={18} />
                </div>
                <input
                  type="text"
                  name="phone_number"
                  className="comic-input w-full pl-11 pr-4 py-3 bg-gray-50 text-[var(--color-c-dark)] placeholder:text-gray-400"
                  placeholder="+1 234 567 8900"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black uppercase tracking-wider text-[var(--color-c-dark)] ml-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-c-dark)]">
                  <FiLock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  className="comic-input w-full pl-11 pr-4 py-3 bg-gray-50 text-[var(--color-c-dark)] placeholder:text-gray-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="comic-button w-full py-4 mt-2 bg-[var(--color-c-yellow)] text-[var(--color-c-dark)] flex items-center justify-center gap-2 text-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "POW! Register"} <FiArrowRight size={20} />
            </button>
          </form>

          <div className="mt-6 text-center border-t-4 border-[var(--color-c-dark)] pt-4 border-dashed">
            <p className="text-[var(--color-c-dark)] font-bold">
              Already a hero?{" "}
              <Link href="/login" className="text-[var(--color-c-purple)] font-black hover:underline decoration-4 underline-offset-4">
                Login here!
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
