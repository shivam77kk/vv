"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MdMenuBook } from "react-icons/md";
import { FiPlay, FiCode, FiCpu, FiCheck } from "react-icons/fi";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Courses() {
  const { token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [goalText, setGoalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [specDraft, setSpecDraft] = useState("");
  const [error, setError] = useState("");

  const colors = ["var(--color-c-blue)", "var(--color-c-pink)", "var(--color-c-green)", "var(--color-c-orange)", "var(--color-c-yellow)"];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchCourses();
  }, [isAuthenticated, router, token]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/my-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCompile = async () => {
    if (!goalText.trim()) {
      setError("Please enter a goal spec.");
      return;
    }
    setError("");
    setDrafting(true);
    setSpecDraft("");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/draft-spec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ goal_text: goalText })
      });
      
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to draft spec");
      
      const data = await res.json();
      setSpecDraft(data.spec_markdown);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDrafting(false);
    }
  };

  const handleDeploy = async () => {
    if (!specDraft) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approved_spec_markdown: specDraft })
      });
      
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to deploy course");
      
      await fetchCourses();
      setGoalText("");
      setSpecDraft("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 pb-20 bg-[var(--color-c-light)] relative overflow-hidden z-0">
      {/* Background decoration */}
      <div className="absolute top-40 left-10 w-24 h-24 bg-[var(--color-c-green)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] animate-bounce -z-10" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[var(--color-c-yellow)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[8px_8px_0_var(--color-c-dark)] animate-spin-slow transform rotate-12 -z-10" style={{ animationDuration: '20s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight drop-shadow-[2px_2px_0_var(--color-c-green)] mb-4">Spec Compiler</h1>
          <p className="font-bold text-[var(--color-c-dark)] bg-[var(--color-c-purple)] text-white inline-block px-4 py-2 border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] rounded-xl transform rotate-2">Compile goals into learning pipelines</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Compiler Input */}
          <div className="comic-panel p-8 bg-[var(--color-c-dark)] text-white flex flex-col">
            <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-b-4 border-white/20 pb-4">
              <FiCode className="text-[var(--color-c-green)]" /> Goal Spec
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500 text-white font-bold rounded border-2 border-white">
                {error}
              </div>
            )}
            
            {!specDraft ? (
              <>
                <textarea 
                  className="w-full bg-black/50 p-4 rounded-xl font-mono text-sm mb-6 border-2 border-[var(--color-c-green)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-c-green)] min-h-[200px]"
                  placeholder={`// Define your learning target\ntarget: "Fullstack Web Developer"\ntimeframe: "3 months"\ncurrent_level: "Intermediate JS"\n\n// Required outputs\noutputs: ["Portfolio Project", "System Architecture Knowledge"]`}
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                />
                
                <button 
                  onClick={handleCompile}
                  disabled={drafting}
                  className="mt-auto comic-button w-full py-4 bg-[var(--color-c-green)] text-[var(--color-c-dark)] text-xl border-white shadow-[6px_6px_0_white] hover:shadow-[8px_8px_0_white] active:shadow-[2px_2px_0_white] disabled:opacity-50"
                >
                  {drafting ? "COMPILING..." : "COMPILE PIPELINE"}
                </button>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs mb-6 border-2 border-[var(--color-c-pink)] text-gray-300 overflow-y-auto max-h-[300px] whitespace-pre-wrap">
                  {specDraft}
                </div>
                
                <div className="mt-auto flex gap-4">
                  <button 
                    onClick={() => setSpecDraft("")}
                    disabled={loading}
                    className="comic-button flex-1 py-3 bg-gray-500 text-white border-white shadow-[4px_4px_0_white] hover:shadow-[6px_6px_0_white] active:shadow-[1px_1px_0_white] disabled:opacity-50"
                  >
                    REJECT
                  </button>
                  <button 
                    onClick={handleDeploy}
                    disabled={loading}
                    className="comic-button flex-1 py-3 bg-[var(--color-c-pink)] text-white border-white shadow-[4px_4px_0_white] hover:shadow-[6px_6px_0_white] active:shadow-[1px_1px_0_white] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? "DEPLOYING..." : <><FiCheck /> DEPLOY</>}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Active Pipelines */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-[var(--color-c-dark)] uppercase flex items-center gap-3 border-b-4 border-[var(--color-c-dark)] pb-4">
              <FiCpu /> Active Pipelines
            </h2>
            
            <div className="space-y-4">
              {courses.length === 0 ? (
                <div className="p-8 bg-white border-4 border-[var(--color-c-dark)] rounded-xl font-bold text-center shadow-[4px_4px_0_var(--color-c-dark)]">
                  No active pipelines found. Compile a goal to get started!
                </div>
              ) : (
                courses.map((course, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    key={course.course_id || i}
                    className="comic-panel p-6 bg-white cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-2xl text-[var(--color-c-dark)] uppercase line-clamp-1">{course.goal || "Untitled Goal"}</h3>
                        <p className="font-bold text-gray-500 uppercase text-xs tracking-wider mt-1">Status: {course.status || "Unknown"}</p>
                      </div>
                      <button 
                        onClick={() => router.push(`/courses/${course.course_id}`)}
                        className="w-10 h-10 rounded-full border-2 border-[var(--color-c-dark)] bg-white flex items-center justify-center hover:bg-[var(--color-c-green)] hover:text-white transition-colors shadow-[2px_2px_0_var(--color-c-dark)] flex-shrink-0"
                      >
                        <FiPlay className="ml-1" />
                      </button>
                    </div>
                    
                    <div>
                      <div className="flex justify-between font-bold text-sm mb-2 text-[var(--color-c-dark)]">
                        <span>Progress</span>
                        <span>{course.progress || 0}%</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 border-2 border-[var(--color-c-dark)] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full border-r-2 border-[var(--color-c-dark)]"
                          style={{ backgroundColor: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
