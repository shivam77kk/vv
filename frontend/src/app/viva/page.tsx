"use client";

import { useState, useEffect, useRef } from "react";
import { FiMonitor, FiSend, FiLoader } from "react-icons/fi";
import { motion } from "motion/react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Viva() {
  const { token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [chat, setChat] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setChat(prev => [...prev, { role: "user", content: userMessage }]);
    setQuery("");
    setLoading(true);
    setError("");

    try {
      if (!sessionId) {
        // Start new session using the query as topic
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/viva/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ topic: userMessage }) // Note: syllabus_doc_id is optional in backend or we pass null
        });

        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        
        if (!res.ok) throw new Error("Failed to start session");
        const data = await res.json();
        
        setSessionId(data.session_id);
        setChat(prev => [...prev, { role: "ai", content: data.question || "Let's begin." }]);
      } else {
        // Continue existing session
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/viva/answer/${sessionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ answer_text: userMessage })
        });

        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        
        if (!res.ok) throw new Error("Failed to submit answer");
        const data = await res.json();
        
        const aiResponse = (data.evaluation?.feedback ? `[Feedback: ${data.evaluation.feedback}]\n\n` : "") + (data.question || data.summary || "Good.");
        setChat(prev => [...prev, { role: "ai", content: aiResponse }]);
        
        if (data.status === "completed") {
          setSessionId(null);
          setChat(prev => [...prev, { role: "ai", content: "[SESSION COMPLETED] View your report in the dashboard." }]);
        }
      }
    } catch (err: any) {
      setError(err.message);
      // Remove the optimistic user message if we failed? Or just show error.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 pb-6 flex flex-col bg-[var(--color-c-light)] relative overflow-hidden z-0">
      {/* Background decoration */}
      <div className="absolute bottom-40 left-10 w-24 h-24 bg-[var(--color-c-pink)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] animate-bounce -z-10" style={{ animationDuration: '4s' }} />

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight drop-shadow-[2px_2px_0_var(--color-c-pink)] mb-2">Glass-Box Viva</h1>
            <p className="font-bold text-[var(--color-c-dark)] bg-[var(--color-c-yellow)] inline-block px-3 py-1 border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] rounded-lg rotate-1">Defend your knowledge!</p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-full bg-white border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] items-center justify-center">
            <FiMonitor size={28} className="text-[var(--color-c-pink)]" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white font-bold rounded border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)]">
            {error}
          </div>
        )}

        <div className="flex-1 bg-white border-4 border-[var(--color-c-dark)] rounded-2xl shadow-[8px_8px_0_var(--color-c-dark)] flex flex-col overflow-hidden max-h-[70vh]">
          
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-cover" style={{ backgroundImage: 'radial-gradient(var(--color-c-light) 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            {chat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                <FiMonitor size={48} className="mb-4 text-[var(--color-c-dark)]" />
                <p className="text-xl font-black text-[var(--color-c-dark)] uppercase">Ready to begin the examination?</p>
                <p className="font-bold text-[var(--color-c-dark)] mt-2 bg-white px-2 border-2 border-[var(--color-c-dark)]">Type a topic to start your Viva session.</p>
              </div>
            ) : (
              chat.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] ${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-c-cyan)] text-[var(--color-c-dark)] rounded-br-none' 
                      : 'bg-white text-[var(--color-c-dark)] rounded-bl-none'
                  }`}>
                    <p className="font-bold whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                 <div className="max-w-[80%] p-4 rounded-xl border-4 border-[var(--color-c-dark)] bg-white shadow-[4px_4px_0_var(--color-c-dark)] rounded-bl-none flex gap-2">
                    <div className="w-3 h-3 bg-[var(--color-c-pink)] rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-[var(--color-c-pink)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-3 h-3 bg-[var(--color-c-pink)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t-4 border-[var(--color-c-dark)] bg-[var(--color-c-light)]">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={!sessionId ? "Enter topic (e.g., Python Basics)..." : "Make your argument..."}
                className="comic-input flex-1 px-4 py-3 bg-white"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className="comic-button px-6 py-3 bg-[var(--color-c-pink)] text-white disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <FiLoader className="animate-spin" size={20} /> : <><FiSend size={20} className="mr-2" /> SEND</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
