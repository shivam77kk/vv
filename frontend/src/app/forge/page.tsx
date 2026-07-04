"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Graph3D from "@/components/Graph3D";
import { FiUploadCloud, FiZap, FiBox } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";

export default function Forge() {
  const { token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeNode, setActiveNode] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [isAuthenticated, router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1,
  });

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/forge/upload-syllabus`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (uploadRes.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!uploadRes.ok) throw new Error("Failed to upload syllabus");
      const { doc_id } = await uploadRes.json();

      const generateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/forge/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ topic, syllabus_doc_id: doc_id }),
      });

      if (generateRes.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!generateRes.ok) throw new Error("Failed to generate graph");
      const { graph_id } = await generateRes.json();

      const poll = setInterval(async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/forge/graph/${graph_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          clearInterval(poll);
          logout();
          router.push("/login");
          return;
        }
        const data = await res.json();
        
        if (data.status === "completed") {
          clearInterval(poll);
          setGraphData({ nodes: data.nodes, links: data.edges });
          setLoading(false);
        } else if (data.status === "failed" || data.status === "error") {
          clearInterval(poll);
          setError(data.error || "Graph generation failed.");
          setLoading(false);
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 md:px-6 bg-[var(--color-c-light)] relative overflow-hidden z-0">
      {/* Background decorations */}
      <div className="absolute top-40 left-10 w-24 h-24 bg-[var(--color-c-cyan)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] animate-bounce -z-10" style={{ animationDuration: '4s' }} />
      <div className="absolute top-60 right-10 w-16 h-16 bg-[var(--color-c-red)] rounded-sm border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] animate-spin-slow -z-10" />
      
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] relative z-10">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-outfit text-[var(--color-c-dark)] uppercase tracking-tight drop-shadow-[2px_2px_0_var(--color-c-yellow)] mb-2">Concept Forge</h1>
            <p className="font-bold text-[var(--color-c-dark)] bg-white inline-block px-3 py-1 border-2 border-[var(--color-c-dark)] shadow-[2px_2px_0_var(--color-c-dark)] rounded-lg">Smash your syllabus into a 3D Graph!</p>
          </div>
          
          {!graphData && (
            <form onSubmit={handleForge} className="flex flex-row flex-wrap gap-3">
              <input
                type="text"
                placeholder="Topic (e.g. Physics)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="comic-input px-4 py-3 flex-1 min-w-[200px]"
                required
              />
              <div 
                {...getRootProps()} 
                className={`comic-input px-4 py-3 flex items-center justify-center cursor-pointer flex-1 min-w-[200px] transition-colors overflow-hidden ${
                  isDragActive ? 'bg-[#FFD93D]' : 'bg-white'
                } ${file ? 'bg-[#6BCB77] text-white' : 'text-gray-600'}`}
              >
                <input {...getInputProps()} />
                <span className="font-bold flex items-center gap-2">
                  <FiUploadCloud size={20} />
                  {file ? file.name : "Drop Syllabus (PDF)"}
                </span>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="comic-button px-6 py-3 bg-[var(--color-c-red)] text-white flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Forging..." : "FORGE!"} <FiZap size={18} />
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--color-c-orange)] text-[var(--color-c-dark)] border-4 border-[var(--color-c-dark)] rounded-xl font-black shadow-[4px_4px_0_var(--color-c-dark)] text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="flex-1 comic-panel relative overflow-hidden bg-[var(--color-c-dark)] flex items-center justify-center p-0">
          {graphData ? (
            <div className="absolute inset-0 cursor-crosshair">
              <Graph3D 
                data={graphData} 
                onNodeClick={(node: any) => setActiveNode(node)} 
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-[var(--color-c-light)] border-4 border-[var(--color-c-dark)] rounded-2xl shadow-[6px_6px_0_var(--color-c-dark)] rotate-1 max-w-sm">
              <div className="w-20 h-20 mx-auto bg-[var(--color-c-yellow)] rounded-full border-4 border-[var(--color-c-dark)] shadow-[4px_4px_0_var(--color-c-dark)] flex items-center justify-center mb-6">
                <FiBox size={32} className="text-[var(--color-c-dark)] animate-bounce" />
              </div>
              <p className="text-xl font-black text-[var(--color-c-dark)] uppercase">Awaiting Input</p>
              <p className="font-bold text-gray-600 mt-2">Upload a syllabus and topic to generate the 3D Concept Graph.</p>
            </div>
          )}

          <AnimatePresence>
            {activeNode && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className="absolute top-4 right-4 w-72 comic-panel p-5 bg-white z-20"
              >
                <div className="flex justify-between items-start mb-4 border-b-4 border-[var(--color-c-dark)] pb-2 border-dashed">
                  <h3 className="font-black text-xl text-[var(--color-c-dark)] uppercase">{activeNode.id}</h3>
                  <button 
                    onClick={() => setActiveNode(null)}
                    className="w-8 h-8 rounded-full border-2 border-[var(--color-c-dark)] bg-[var(--color-c-red)] text-white font-black flex items-center justify-center shadow-[2px_2px_0_var(--color-c-dark)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    X
                  </button>
                </div>
                {activeNode.description && (
                  <p className="text-sm font-bold text-gray-700 leading-relaxed mb-4">{activeNode.description}</p>
                )}
                {activeNode.complexity && (
                  <div className="inline-block px-3 py-1 bg-[var(--color-c-yellow)] border-2 border-[var(--color-c-dark)] rounded font-black text-[var(--color-c-dark)] text-xs uppercase shadow-[2px_2px_0_var(--color-c-dark)]">
                    Complexity: {activeNode.complexity}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
      </div>
    </div>
  );
}
