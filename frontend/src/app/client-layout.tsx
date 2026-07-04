"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/store";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return null; // or a loader
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">
        {children}
      </main>
    </>
  );
}
