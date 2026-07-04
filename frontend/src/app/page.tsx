"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FiArrowRight, FiMonitor, FiZap } from "react-icons/fi";
import { MdOutlineArchitecture, MdGroups, MdMenuBook, MdLibraryAddCheck } from "react-icons/md";

export default function Home() {
  const features = [
    {
      title: "Concept Forge",
      description: "Transform syllabi into interactive knowledge graphs! Smash those PDFs!",
      icon: <MdOutlineArchitecture size={32} />,
      href: "/forge",
      color: "var(--color-c-yellow)",
      delay: 0.1,
    },
    {
      title: "Skill Exchange",
      description: "Build, distribute, and collect agentic study skills!",
      icon: <MdLibraryAddCheck size={32} />,
      href: "/skills",
      color: "var(--color-c-cyan)",
      delay: 0.2,
    },
    {
      title: "Glass-Box Viva",
      description: "Face the ultimate AI examination with real-time reasoning!",
      icon: <FiMonitor size={32} />,
      href: "/viva",
      color: "var(--color-c-pink)",
      delay: 0.3,
    },
    {
      title: "Study Squad",
      description: "Multi-agent negotiation for scheduling peer sessions!",
      icon: <MdGroups size={32} />,
      href: "/squad",
      color: "var(--color-c-orange)",
      delay: 0.4,
    },
    {
      title: "Spec Compiler",
      description: "Compile goals into deployed learning pipelines!",
      icon: <MdMenuBook size={32} />,
      href: "/courses",
      color: "var(--color-c-green)",
      delay: 0.5,
    }
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--color-c-light)] pt-16">
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 md:px-6 pt-20 md:pt-32 pb-16 md:pb-24 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-4 border-[var(--color-c-dark)] bg-[var(--color-c-purple)] text-white text-sm font-black mb-8 uppercase tracking-widest shadow-[4px_4px_0_var(--color-c-dark)] transform -rotate-2">
            <FiZap size={16} className="animate-pulse" />
            VidyaVibe Core 2.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black font-outfit tracking-tighter mb-6 text-[var(--color-c-dark)] leading-[1.1] uppercase drop-shadow-[4px_4px_0_var(--color-c-cyan)]">
            SUPERCHARGE <br className="hidden md:block" />
            <span className="text-[var(--color-c-red)] drop-shadow-[4px_4px_0_var(--color-c-dark)]">YOUR LEARNING</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[var(--color-c-dark)] font-bold mb-12 max-w-2xl mx-auto leading-relaxed border-4 border-[var(--color-c-dark)] bg-[var(--color-c-yellow)] p-6 rounded-2xl shadow-[6px_6px_0_var(--color-c-dark)] transform rotate-1">
            An explosively powerful orchestration platform that dynamically structures, evaluates, and compiles personalized learning paths!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register" className="w-full sm:w-auto px-10 py-4 bg-[var(--color-c-red)] text-white rounded-full font-black text-xl border-4 border-[var(--color-c-dark)] shadow-[6px_6px_0_var(--color-c-dark)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-c-dark)] active:translate-y-0 active:shadow-[2px_2px_0_var(--color-c-dark)] transition-all flex items-center justify-center gap-3 uppercase">
              Start Now! <FiArrowRight size={24} />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-10 py-4 bg-white text-[var(--color-c-dark)] rounded-full font-black text-xl border-4 border-[var(--color-c-dark)] shadow-[6px_6px_0_var(--color-c-dark)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-c-dark)] active:translate-y-0 active:shadow-[2px_2px_0_var(--color-c-dark)] transition-all uppercase">
              Login
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 md:px-6 pb-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-[auto] md:auto-rows-[250px]">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", bounce: 0.4, delay: feature.delay }}
              className={`comic-panel p-6 md:p-8 flex flex-col justify-between hover:-translate-y-2 group cursor-pointer ${
                i === 0 ? "md:col-span-2 md:row-span-2" : ""
              } ${
                i === 3 ? "lg:col-span-2" : ""
              }`}
              style={{ backgroundColor: feature.color }}
            >
              <div>
                <div className="w-16 h-16 rounded-full bg-white border-4 border-[var(--color-c-dark)] flex items-center justify-center mb-6 shadow-[4px_4px_0_var(--color-c-dark)] group-hover:scale-110 transition-transform">
                  <div className="text-[var(--color-c-dark)]">
                    {feature.icon}
                  </div>
                </div>
                <h3 className={`font-outfit font-black text-[var(--color-c-dark)] mb-3 tracking-tight uppercase ${i === 0 ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>
                  {feature.title}
                </h3>
                <p className={`font-bold text-[var(--color-c-dark)] leading-relaxed bg-white/50 p-3 rounded-lg border-2 border-[var(--color-c-dark)] ${i === 0 ? 'text-lg md:text-xl max-w-md' : 'text-base'}`}>
                  {feature.description}
                </p>
              </div>
              
              <Link href={feature.href} className="mt-6 inline-flex items-center gap-2 text-[var(--color-c-dark)] font-black text-lg bg-white w-fit px-4 py-2 rounded-full border-2 border-[var(--color-c-dark)] shadow-[3px_3px_0_var(--color-c-dark)] group-hover:shadow-[5px_5px_0_var(--color-c-dark)] transition-shadow uppercase">
                Explore <FiArrowRight />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
