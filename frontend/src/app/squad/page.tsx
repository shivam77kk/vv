"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MdGroups } from "react-icons/md";
import { FiUsers, FiCalendar, FiCheckCircle, FiPlus, FiCopy, FiCheck, FiChevronDown, FiChevronUp, FiXCircle } from "react-icons/fi";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Squad() {
  const { token, user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [proposeParticipantId, setProposeParticipantId] = useState("");
  const [proposing, setProposing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [consenting, setConsenting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchGroups();
  }, [isAuthenticated, router, token]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/squad/my-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch study groups");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeParticipantId.trim()) return;
    
    setProposing(true);
    setError("");
    
    try {
      const participantIds = proposeParticipantId.split(",").map(id => id.trim()).filter(Boolean);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/squad/propose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ participant_ids: participantIds })
      });
      
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to propose session");
      
      setProposeParticipantId("");
      await fetchGroups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProposing(false);
    }
  };

  const handleConsent = async (groupId: string, approve: boolean) => {
    setConsenting(groupId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/squad/${groupId}/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approve })
      });
      if (!res.ok) throw new Error("Failed to submit consent");
      await fetchGroups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConsenting(null);
    }
  };

  const copyMyId = () => {
    if (user?.user_id) {
      navigator.clipboard.writeText(user.user_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Get all unique recent logs for the activity feed
  const recentLogs = groups
    .flatMap(g => (g.negotiation_log || []).map((log: any) => ({ ...log, group_id: g.group_id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 pb-20 bg-[var(--color-c-light)] relative overflow-hidden z-0">
      <div className="absolute top-32 right-20 w-40 h-40 bg-[var(--color-c-blue)] rounded-xl border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-spin-slow transform rotate-12 -z-10" style={{ animationDuration: '15s' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight drop-shadow-[2px_2px_0_var(--color-c-orange)] mb-4">Study Squad</h1>
          <p className="font-bold text-[var(--color-c-dark)] bg-[var(--color-c-yellow)] inline-block px-4 py-2 border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] rounded-xl transform -rotate-1">Multi-agent peer negotiation</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500 text-white border-4 border-[var(--color-c-dark)] rounded-xl font-bold shadow-[4px_4px_0_var(--color-c-dark)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-[var(--color-c-dark)] uppercase flex items-center gap-2 border-b-4 border-[var(--color-c-dark)] pb-2 inline-flex">
              <FiCalendar /> Upcoming Sessions
            </h2>
            
            <div className="space-y-4">
              {loading ? (
                <div className="p-8 text-center text-[var(--color-c-dark)] font-bold">Loading sessions...</div>
              ) : groups.length === 0 ? (
                <div className="comic-panel p-8 bg-white text-center text-gray-500 font-bold border-dashed">
                  No active study sessions. Propose one to get started!
                </div>
              ) : (
                groups.map((group, i) => {
                  const isExpanded = expandedGroupId === group.group_id;
                  const hasConsented = user?.user_id && group.consents && group.consents[user.user_id] !== undefined;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={group.group_id || i}
                      className="comic-panel bg-white overflow-hidden"
                    >
                      {/* Card Header (Always visible) */}
                      <div 
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedGroupId(isExpanded ? null : group.group_id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[var(--color-c-orange)] border-2 border-[var(--color-c-dark)] flex items-center justify-center text-white shadow-[2px_2px_0_var(--color-c-dark)]">
                            <MdGroups size={24} />
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-[var(--color-c-dark)] uppercase">Study Group #{group.group_id?.slice(-4) || "N/A"}</h3>
                            <p className="font-bold text-gray-600">Participants: {group.participants?.length || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-gray-500 uppercase">Match</span>
                            <span className="font-black text-[var(--color-c-blue)]">
                              {group.match_score ? `${Math.round(group.match_score * 100)}%` : "--"}
                            </span>
                          </div>
                          <div className={`px-4 py-2 rounded-lg border-2 border-[var(--color-c-dark)] font-black text-sm uppercase shadow-[2px_2px_0_var(--color-c-dark)] ${
                            group.status === 'confirmed' ? 'bg-[var(--color-c-green)] text-[var(--color-c-dark)]' :
                            group.status === 'awaiting_consent' ? 'bg-[var(--color-c-yellow)] text-[var(--color-c-dark)]' :
                            group.status === 'declined' ? 'bg-[var(--color-c-red)] text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {group.status || "Unknown"}
                          </div>
                          <button className="text-xl">
                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t-4 border-dashed border-[var(--color-c-dark)] bg-gray-50"
                          >
                            <div className="p-6 space-y-6">
                              {/* Agenda & Time */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 border-2 border-[var(--color-c-dark)] rounded-lg shadow-[2px_2px_0_var(--color-c-dark)]">
                                  <h4 className="font-black uppercase text-[var(--color-c-dark)] mb-2">Proposed Agenda</h4>
                                  <ul className="list-disc pl-5 font-bold text-sm text-gray-700 space-y-1">
                                    {group.agenda?.map((topic: string, idx: number) => (
                                      <li key={idx}>{topic}</li>
                                    )) || <li>No agenda provided</li>}
                                  </ul>
                                </div>
                                <div className="bg-white p-4 border-2 border-[var(--color-c-dark)] rounded-lg shadow-[2px_2px_0_var(--color-c-dark)] flex flex-col justify-center items-center text-center">
                                  <h4 className="font-black uppercase text-[var(--color-c-dark)] mb-2">Proposed Time</h4>
                                  <p className="font-bold text-lg text-[var(--color-c-blue)]">
                                    {group.scheduled_time ? new Date(group.scheduled_time).toLocaleString() : "TBD"}
                                  </p>
                                </div>
                              </div>

                              {/* Negotiation Log Viewer */}
                              <div>
                                <h4 className="font-black uppercase text-[var(--color-c-dark)] mb-3 flex items-center gap-2">
                                  Agent Negotiation Log
                                </h4>
                                <div className="bg-[var(--color-c-dark)] text-white p-4 rounded-xl border-2 border-[var(--color-c-dark)] shadow-[4px_4px_0_rgba(0,0,0,0.5)] h-64 overflow-y-auto space-y-4">
                                  {group.negotiation_log?.map((log: any, idx: number) => (
                                    <div key={idx} className="bg-white/10 p-3 rounded-lg">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-black text-[var(--color-c-yellow)] text-xs uppercase">{log.agent}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                      <p className="font-medium text-sm text-gray-100">{log.message}</p>
                                    </div>
                                  )) || <p className="text-gray-400 font-bold text-sm">No negotiation data available.</p>}
                                </div>
                              </div>

                              {/* Consent Action Buttons */}
                              {group.status === "awaiting_consent" && !hasConsented && (
                                <div className="bg-[var(--color-c-yellow)] p-4 rounded-xl border-2 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)]">
                                  <p className="font-black text-[var(--color-c-dark)] text-center mb-4 uppercase">Your Agent needs your approval to confirm this session.</p>
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() => handleConsent(group.group_id, false)}
                                      disabled={consenting === group.group_id}
                                      className="flex-1 comic-button py-3 bg-[var(--color-c-red)] text-white flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                      <FiXCircle /> Decline
                                    </button>
                                    <button
                                      onClick={() => handleConsent(group.group_id, true)}
                                      disabled={consenting === group.group_id}
                                      className="flex-1 comic-button py-3 bg-[var(--color-c-green)] text-[var(--color-c-dark)] flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                      <FiCheckCircle /> Approve
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {hasConsented && group.status === "awaiting_consent" && (
                                <div className="text-center font-bold text-[var(--color-c-green)] bg-green-100 p-3 rounded border-2 border-[var(--color-c-green)]">
                                  You have consented! Waiting for other participants...
                                </div>
                              )}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Sidebar / Controls Area */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[var(--color-c-dark)] uppercase flex items-center gap-2 border-b-4 border-[var(--color-c-dark)] pb-2 inline-flex">
              <FiUsers /> Agent Controls
            </h2>
            
            <div className="comic-panel p-6 bg-[var(--color-c-cyan)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-[var(--color-c-dark)] uppercase">Propose Session</h3>
                <button 
                  onClick={copyMyId}
                  className="bg-white p-1.5 rounded border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs font-black flex items-center gap-1"
                  title="Copy My User ID"
                >
                  {copiedId ? <FiCheck className="text-[var(--color-c-green)]" /> : <FiCopy />}
                  {copiedId ? "Copied" : "My ID"}
                </button>
              </div>
              
              <p className="text-center font-bold text-sm text-[var(--color-c-dark)] mb-4">
                Enter comma-separated User IDs to initiate a study group negotiation.
              </p>
              
              <form onSubmit={handlePropose} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. 60d5ecb..." 
                  value={proposeParticipantId}
                  onChange={(e) => setProposeParticipantId(e.target.value)}
                  className="comic-input p-3"
                  required
                />
                <button 
                  type="submit"
                  disabled={proposing}
                  className="comic-button py-3 bg-[var(--color-c-red)] text-white font-black uppercase flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <FiPlus /> {proposing ? "PROPOSING..." : "PROPOSE"}
                </button>
              </form>
            </div>
            
            <div className="comic-panel p-6 bg-[var(--color-c-yellow)] border-dashed">
              <h3 className="font-black text-xl text-[var(--color-c-dark)] uppercase mb-4 flex items-center gap-2"><FiCheckCircle /> Activity Log</h3>
              <ul className="space-y-3 font-bold text-sm text-[var(--color-c-dark)]">
                {recentLogs.map((log: any, i: number) => (
                  <li key={i} className="flex flex-col bg-white p-3 rounded-lg border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between text-[10px] text-gray-500 uppercase mb-1">
                      <span>{log.agent}</span>
                      <span>Grp {log.group_id?.slice(-4)}</span>
                    </div>
                    <span className="line-clamp-2">{log.message}</span>
                  </li>
                ))}
                {recentLogs.length === 0 && (
                  <li className="flex items-start gap-2 bg-white p-2 rounded border-2 border-[var(--color-c-dark)] text-gray-500">
                    No recent activity.
                  </li>
                )}
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
