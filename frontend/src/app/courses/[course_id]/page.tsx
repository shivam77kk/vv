"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { motion, AnimatePresence } from "motion/react";
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiAlertTriangle } from "react-icons/fi";

export default function CoursePlayer() {
  const { course_id } = useParams();
  const { token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModId, setActiveModId] = useState<string>("");

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchPipeline();
  }, [isAuthenticated, router, token, course_id]);

  const fetchPipeline = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${course_id}/pipeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch course");
      const data = await res.json();
      setCourse(data);
      
      if (!activeModId && data.modules) {
        const activeMod = data.modules.find((m: any) => m.status === "active" || m.status === "failed" || m.status === "rolled_back");
        if (activeMod) setActiveModId(activeMod.module_id);
        else setActiveModId(data.modules[0]?.module_id || "");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex: number, optIndex: number, optValue: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optValue }));
  };

  const handleSubmitQuiz = async (moduleId: string) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const formattedAnswers = Object.entries(answers).map(([idx, ans]) => ({
        question_index: parseInt(idx),
        answer: ans
      }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${course_id}/checkpoint/${moduleId}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      if (!res.ok) throw new Error("Failed to submit checkpoint");
      
      const result = await res.json();
      
      try {
        setFeedback({
          passed: result.passed,
          score: result.score,
          items: JSON.parse(result.feedback)
        });
      } catch (e) {
        setFeedback({
          passed: result.passed,
          score: result.score,
          raw: result.feedback
        });
      }

      await fetchPipeline();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nextModule = () => {
    setFeedback(null);
    setAnswers({});
    const currentIndex = course.modules.findIndex((m: any) => m.module_id === activeModId);
    if (currentIndex < course.modules.length - 1) {
      setActiveModId(course.modules[currentIndex + 1].module_id);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 text-center font-bold">Loading Pipeline...</div>;
  if (!course) return <div className="min-h-screen pt-32 text-center text-red-500 font-bold">{error}</div>;

  const activeModule = course.modules?.find((m: any) => m.module_id === activeModId);

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 pb-20 bg-[var(--color-c-light)] relative overflow-hidden z-0">
      <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar / Pipeline Graph */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="comic-panel p-6 bg-white mb-6">
            <h2 className="font-black text-2xl uppercase border-b-4 border-[var(--color-c-dark)] pb-2 mb-4">Pipeline</h2>
            <div className="space-y-3 relative">
              <div className="absolute left-4 top-4 bottom-4 w-1 bg-[var(--color-c-dark)] -z-10 hidden md:block" />
              {course.modules.map((m: any, idx: number) => (
                <div 
                  key={m.module_id}
                  onClick={() => setActiveModId(m.module_id)}
                  className={`relative p-3 border-2 border-[var(--color-c-dark)] rounded-lg cursor-pointer transition-transform ${
                    activeModId === m.module_id ? 'translate-x-2 bg-[var(--color-c-yellow)] shadow-[4px_4px_0_var(--color-c-dark)]' : 
                    m.status === 'locked' ? 'bg-gray-200 opacity-60 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border-2 border-black flex-shrink-0 ${
                      m.status === 'passed' ? 'bg-[var(--color-c-green)]' : 
                      m.status === 'failed' || m.status === 'rolled_back' ? 'bg-[var(--color-c-red)]' : 
                      m.status === 'active' ? 'bg-[var(--color-c-cyan)] animate-pulse' : 'bg-gray-400'
                    }`} />
                    <span className="font-bold text-sm uppercase line-clamp-1 flex-1">{m.title}</span>
                    {m.is_remedial && <span className="text-[10px] bg-[var(--color-c-orange)] px-1 font-black rounded">REVIEW</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => router.push('/courses')} className="comic-button w-full py-3 bg-[var(--color-c-dark)] text-white flex items-center justify-center gap-2">
            <FiArrowLeft /> Back to Courses
          </button>
        </div>

        {/* Module Content Area */}
        <div className="w-full md:w-2/3">
          {activeModule ? (
            <div className="comic-panel p-6 md:p-8 bg-white">
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black uppercase text-[var(--color-c-dark)]">{activeModule.title}</h1>
                  <p className="font-bold text-gray-500 mt-1">{activeModule.description}</p>
                </div>
                <div className="bg-[var(--color-c-dark)] text-white font-black px-3 py-1 text-sm border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-yellow)] transform rotate-2">
                  {activeModule.status}
                </div>
              </div>

              {activeModule.status === "rolled_back" && (
                <div className="mb-6 p-4 bg-[var(--color-c-red)] text-white font-bold rounded-lg flex gap-3 items-center border-4 border-black">
                  <FiAlertTriangle size={24} />
                  You failed this checkpoint 3 times. A remedial review module has been inserted into your pipeline. Please complete the review module first.
                </div>
              )}

              <div className="prose max-w-none font-medium mb-12 text-gray-800 whitespace-pre-wrap leading-relaxed">
                {activeModule.content}
              </div>

              {/* Checkpoint Quiz */}
              {activeModule.status !== "locked" && activeModule.checkpoint_questions && activeModule.checkpoint_questions.length > 0 && (
                <div className="mt-8 border-t-4 border-dashed border-[var(--color-c-dark)] pt-8">
                  <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                    <FiCheckCircle className="text-[var(--color-c-green)]" /> Checkpoint
                  </h2>

                  <div className="space-y-8">
                    {activeModule.checkpoint_questions.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-[var(--color-c-light)] p-5 rounded-xl border-2 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)]">
                        <p className="font-black text-lg mb-4">{qIdx + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isSelected = answers[qIdx] === opt;
                            let itemFeedback = null;
                            if (feedback && feedback.items) {
                              itemFeedback = feedback.items.find((f: any) => f.question === q.question);
                            }

                            let optClass = "bg-white hover:bg-gray-50";
                            if (isSelected) optClass = "bg-[var(--color-c-blue)] text-white";
                            
                            // If graded, highlight correct/wrong
                            if (feedback && itemFeedback) {
                              const isCorrectAnswer = opt.trim().toUpperCase().startsWith(q.correct_answer.trim().toUpperCase());
                              if (isCorrectAnswer) optClass = "bg-[var(--color-c-green)] text-white border-green-700";
                              else if (isSelected && !itemFeedback.correct) optClass = "bg-[var(--color-c-red)] text-white";
                            }

                            return (
                              <div 
                                key={optIdx} 
                                onClick={() => !feedback && handleOptionSelect(qIdx, optIdx, opt)}
                                className={`p-3 border-2 border-[var(--color-c-dark)] rounded font-bold cursor-pointer transition-colors ${optClass} ${feedback ? 'cursor-default' : ''}`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                        {feedback && feedback.items && (
                          <div className="mt-3">
                            {feedback.items.find((f: any) => f.question === q.question)?.correct ? (
                              <p className="text-[var(--color-c-green)] font-black flex items-center gap-1"><FiCheckCircle /> Correct!</p>
                            ) : (
                              <p className="text-[var(--color-c-red)] font-black flex items-center gap-1"><FiXCircle /> Incorrect. {feedback.items.find((f: any) => f.question === q.question)?.explanation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!feedback ? (
                    <button 
                      onClick={() => handleSubmitQuiz(activeModule.module_id)}
                      disabled={submitting || Object.keys(answers).length < activeModule.checkpoint_questions.length}
                      className="mt-8 comic-button w-full py-4 bg-[var(--color-c-pink)] text-white text-xl disabled:opacity-50"
                    >
                      {submitting ? "VERIFYING..." : "SUBMIT ANSWERS"}
                    </button>
                  ) : (
                    <div className="mt-8 p-6 bg-gray-100 border-4 border-[var(--color-c-dark)] rounded-xl text-center shadow-[4px_4px_0_var(--color-c-dark)]">
                      <h3 className="text-3xl font-black uppercase mb-2">Score: {feedback.score}%</h3>
                      {feedback.passed ? (
                        <div>
                          <p className="text-[var(--color-c-green)] font-black text-xl mb-4">Module Passed!</p>
                          <button onClick={nextModule} className="comic-button px-8 py-3 bg-[var(--color-c-green)] text-[var(--color-c-dark)] flex items-center gap-2 mx-auto">
                            CONTINUE <FiArrowRight />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[var(--color-c-red)] font-black text-xl mb-4">Module Failed.</p>
                          <button onClick={() => setFeedback(null)} className="comic-button px-8 py-3 bg-[var(--color-c-orange)] text-[var(--color-c-dark)] mx-auto">
                            RETRY CHECKPOINT
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center font-bold text-gray-500">Select a module to begin.</div>
          )}
        </div>
      </div>
    </div>
  );
}
