"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { FiDownload, FiStar, FiCheck, FiSend, FiMessageSquare } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";

interface Skill {
  id: string;
  skill_id?: string;
  name: string;
  description: string;
  author: string;
  author_name?: string;
  downloads: number;
  install_count?: number;
  rating: number;
  avg_rating?: number;
  tags: string[];
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  skill_used?: string;
}

export default function Skills() {
  const { token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [installedSkills, setInstalledSkills] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState("");

  // Sandbox Chat State
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchSkills = async () => {
      try {
        const [libraryRes, installedRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/library`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/my-skills`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (libraryRes.status === 401 || installedRes.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        
        if (!libraryRes.ok) throw new Error("Failed to fetch skills");
        
        const data = await libraryRes.json();
        const fetchedSkills = data.skills || data;
        
        if (Array.isArray(fetchedSkills)) {
          setSkills(fetchedSkills.map((s: any) => ({
            ...s,
            id: s.skill_id || s.id || s._id,
            author: s.author_name || s.author || "Community",
            rating: s.avg_rating || s.rating || 5.0,
            downloads: s.install_count || s.downloads || 0,
            tags: s.tags || []
          })));
        }

        if (installedRes.ok) {
          const installedData = await installedRes.json();
          if (installedData.installed_skills) {
            setInstalledSkills(new Set(installedData.installed_skills.map((s: any) => s.skill_id)));
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [isAuthenticated, router, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleInstall = async (skillId: string, skillName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${skillId}/install`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInstalledSkills(prev => new Set(prev).add(skillId));
        setToastMessage(`Successfully installed ${skillName}!`);
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sending) return;

    const query = chatInput.trim();
    setChat(prev => [...prev, { role: "user", content: query }]);
    setChatInput("");
    setSending(true);

    try {
      // Find any installed skill to route to (backend router will pick the best one anyway)
      const testSkillId = Array.from(installedSkills)[0] || "dummy";
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${testSkillId}/invoke`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ user_query: query })
      });
      
      if (!res.ok) throw new Error("Failed to invoke skill");
      const data = await res.json();
      
      setChat(prev => [...prev, { 
        role: "ai", 
        content: data.response,
        skill_used: data.skill_name 
      }]);
    } catch (err: any) {
      setChat(prev => [...prev, { role: "ai", content: `Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const colors = ["var(--color-c-red)", "var(--color-c-yellow)", "var(--color-c-blue)", "var(--color-c-green)", "var(--color-c-pink)", "var(--color-c-cyan)"];

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 pb-20 bg-[var(--color-c-light)] relative overflow-hidden z-0">
      <div className="absolute top-20 right-10 w-32 h-32 bg-[var(--color-c-orange)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-bounce -z-10" style={{ animationDuration: '5s' }} />

      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-c-green)] text-white px-6 py-3 rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] font-black uppercase text-lg flex items-center gap-2"
          >
            <FiCheck size={24} /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col xl:flex-row gap-8">
        
        {/* Left Side: Skills Exchange */}
        <div className="w-full xl:w-2/3">
          <div className="mb-10 text-left">
            <h1 className="text-4xl md:text-6xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight drop-shadow-[2px_2px_0_var(--color-c-cyan)] mb-4">Skill Exchange</h1>
            <p className="font-bold text-[var(--color-c-dark)] bg-[var(--color-c-yellow)] inline-block px-4 py-2 border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] rounded-xl transform -rotate-2">Equip your agents with community superpowers!</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[var(--color-c-red)] text-white border-4 border-[var(--color-c-dark)] rounded-xl font-black shadow-[4px_4px_0_var(--color-c-dark)] text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center my-20">
              <div className="w-16 h-16 border-8 border-[var(--color-c-dark)] border-t-[var(--color-c-yellow)] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {skills.map((skill, index) => {
                const cardColor = colors[index % colors.length];
                const isInstalled = installedSkills.has(skill.id);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={skill.id}
                    className="comic-panel p-6 flex flex-col hover:-translate-y-2 group cursor-pointer"
                    style={{ backgroundColor: cardColor }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-[var(--color-c-dark)] uppercase bg-white px-2 border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] -rotate-1 line-clamp-1">{skill.name}</h3>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] flex-shrink-0">
                        <FiStar className="text-[var(--color-c-yellow)] fill-[var(--color-c-yellow)]" size={14} />
                        <span className="text-xs font-black text-[var(--color-c-dark)]">{skill.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-[var(--color-c-dark)] font-bold mb-6 flex-1 bg-white/60 p-3 rounded-lg border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] text-sm">
                      {skill.description}
                    </p>
                    
                    <div className="flex items-center justify-between border-t-4 border-[var(--color-c-dark)] border-dashed pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[var(--color-c-dark)] bg-white px-1 border-2 border-[var(--color-c-dark)] truncate max-w-[100px]">@{skill.author}</span>
                      </div>
                      
                      <button 
                        onClick={() => !isInstalled && handleInstall(skill.id, skill.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[var(--color-c-dark)] rounded-full text-xs font-black uppercase shadow-[2px_2px_0_var(--color-c-dark)] transition-all ${isInstalled ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-c-dark)] active:translate-y-0 active:shadow-[1px_1px_0_var(--color-c-dark)]'}`}
                      >
                        {isInstalled ? <><FiCheck size={14} /> Installed</> : <><FiDownload size={14} /> Install</>}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              
              {skills.length === 0 && (
                <div className="col-span-full p-8 text-center text-xl font-black bg-white rounded-xl border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)]">
                  No skills found in the exchange. Be the first to forge one!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Skill Sandbox Chat */}
        <div className="w-full xl:w-1/3 flex flex-col h-[600px] xl:h-[800px] comic-panel p-0 overflow-hidden bg-[var(--color-c-dark)]">
          <div className="p-4 bg-[var(--color-c-dark)] border-b-4 border-white/20 text-white flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase flex items-center gap-2">
              <FiMessageSquare className="text-[var(--color-c-cyan)]" /> Skill Sandbox
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
            <div className="text-center">
              <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                AI will automatically route your queries to the best installed skill!
              </span>
            </div>
            
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] font-bold ${
                  msg.role === 'user' 
                    ? 'bg-[var(--color-c-cyan)] text-[var(--color-c-dark)] rounded-tr-none' 
                    : 'bg-white text-[var(--color-c-dark)] rounded-tl-none'
                }`}>
                  {msg.skill_used && (
                    <div className="text-[10px] text-[var(--color-c-pink)] uppercase font-black mb-1 bg-gray-100 inline-block px-1 rounded">
                      Using Skill: {msg.skill_used}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white text-[var(--color-c-dark)] max-w-[85%] rounded-xl rounded-tl-none p-3 border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)]">
                  <span className="font-bold flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--color-c-cyan)] rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-[var(--color-c-yellow)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-[var(--color-c-pink)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendQuery} className="p-4 bg-[var(--color-c-dark)] border-t-4 border-white/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask something to trigger a skill..."
                className="flex-1 comic-input py-2 px-3 bg-white text-[var(--color-c-dark)] text-sm"
                disabled={sending || installedSkills.size === 0}
              />
              <button 
                type="submit"
                disabled={sending || !chatInput.trim() || installedSkills.size === 0}
                className="comic-button bg-[var(--color-c-green)] text-[var(--color-c-dark)] px-4 flex items-center justify-center disabled:opacity-50"
              >
                <FiSend />
              </button>
            </div>
            {installedSkills.size === 0 && (
              <p className="text-red-400 text-xs mt-2 font-bold text-center">Please install at least one skill to use the sandbox.</p>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
