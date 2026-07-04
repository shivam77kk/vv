"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/lib/store";
import { FiMonitor, FiLogOut, FiUser, FiMenu, FiX } from "react-icons/fi";
import { MdOutlineArchitecture, MdGroups, MdMenuBook, MdLibraryAddCheck } from "react-icons/md";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/forge", label: "Forge", icon: <MdOutlineArchitecture size={18} />, color: "var(--color-c-yellow)" },
    { href: "/skills", label: "Skills", icon: <MdLibraryAddCheck size={18} />, color: "var(--color-c-cyan)" },
    { href: "/viva", label: "Viva", icon: <FiMonitor size={18} />, color: "var(--color-c-pink)" },
    { href: "/squad", label: "Squad", icon: <MdGroups size={18} />, color: "var(--color-c-orange)" },
    { href: "/courses", label: "Courses", icon: <MdMenuBook size={18} />, color: "var(--color-c-green)" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-white border-b-4 border-[var(--color-c-dark)] px-4 md:px-6 flex items-center justify-between shadow-[0_4px_0_var(--color-c-dark)]">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-outfit text-xl md:text-2xl font-black tracking-tight text-[var(--color-c-dark)] flex items-center gap-2 hover:scale-105 transition-transform">
            <div className="w-8 h-8 rounded-full bg-[var(--color-c-red)] border-2 border-[var(--color-c-dark)] flex items-center justify-center shadow-[2px_2px_0_var(--color-c-dark)]">
              <span className="text-white text-sm font-black leading-none uppercase">V</span>
            </div>
            VIDYAVIBE
          </Link>
          
          {isAuthenticated() && (
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-transform flex items-center gap-2 uppercase tracking-wide border-2 border-transparent hover:border-[var(--color-c-dark)] hover:shadow-[2px_2px_0_var(--color-c-dark)] hover:-translate-y-0.5 ${
                    pathname.startsWith(link.href)
                      ? "text-[var(--color-c-dark)] border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)]"
                      : "text-gray-600"
                  }`}
                  style={{ backgroundColor: pathname.startsWith(link.href) ? link.color : 'transparent' }}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {link.icon}
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated() ? (
            <div className="hidden md:flex items-center gap-4">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-c-dark)] active:translate-y-0 active:shadow-[1px_1px_0_var(--color-c-dark)] transition-all outline-none bg-white">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-c-blue)] border-2 border-[var(--color-c-dark)] flex items-center justify-center text-white">
                    <FiUser size={12} />
                  </div>
                  <span className="text-sm font-black text-[var(--color-c-dark)] tracking-wide">{user?.email.split('@')[0]}</span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content 
                    className="min-w-[150px] bg-white rounded-xl p-2 shadow-[4px_4px_0_var(--color-c-dark)] border-2 border-[var(--color-c-dark)] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 mr-6 z-50 mt-2"
                  >
                    <DropdownMenu.Item
                      className="px-3 py-2 text-sm font-black rounded-lg cursor-pointer outline-none transition-colors text-[var(--color-c-red)] hover:bg-[var(--color-c-red)] hover:text-white flex items-center gap-2 uppercase tracking-wide border-2 border-transparent hover:border-[var(--color-c-dark)]"
                      onClick={() => {
                        logout();
                        window.location.href = "/";
                      }}
                    >
                      <FiLogOut size={16} /> Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-black text-[var(--color-c-dark)] hover:text-[var(--color-c-blue)] transition-colors uppercase tracking-wider">
                Login
              </Link>
              <Link href="/register" className="px-5 py-2 rounded-full bg-[var(--color-c-yellow)] border-2 border-[var(--color-c-dark)] shadow-[3px_3px_0_var(--color-c-dark)] hover:shadow-[5px_5px_0_var(--color-c-dark)] hover:-translate-y-1 active:shadow-[1px_1px_0_var(--color-c-dark)] active:translate-y-0 text-[var(--color-c-dark)] font-black text-sm uppercase tracking-wider transition-all">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-lg border-2 border-[var(--color-c-dark)] bg-[var(--color-c-yellow)] shadow-[2px_2px_0_var(--color-c-dark)] active:shadow-none active:translate-y-0.5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[var(--color-c-light)] pt-20 px-4 pb-4 overflow-y-auto flex flex-col gap-4"
          >
            {isAuthenticated() ? (
              <>
                <div className="bg-white p-4 rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-c-blue)] border-2 border-[var(--color-c-dark)] flex items-center justify-center text-white">
                    <FiUser size={20} />
                  </div>
                  <span className="text-lg font-black text-[var(--color-c-dark)] truncate">{user?.email}</span>
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-4 rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] text-lg font-black flex items-center gap-3 uppercase active:shadow-none active:translate-y-1 transition-all"
                    style={{ backgroundColor: link.color }}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/";
                  }}
                  className="mt-auto p-4 rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] bg-[var(--color-c-red)] text-white text-lg font-black flex items-center justify-center gap-2 uppercase active:shadow-none active:translate-y-1 transition-all"
                >
                  <FiLogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4 mt-8">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full p-4 text-center rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] bg-white text-[var(--color-c-dark)] text-xl font-black uppercase active:shadow-none active:translate-y-1 transition-all"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full p-4 text-center rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] bg-[var(--color-c-yellow)] text-[var(--color-c-dark)] text-xl font-black uppercase active:shadow-none active:translate-y-1 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
