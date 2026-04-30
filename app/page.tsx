"use client";

import React from "react";
import { Snowflake, ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] overflow-hidden font-sans">
      
      {/* --- DESIGNER BACKGROUND ELEMENTS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-purple-400/10 rounded-full blur-[80px]"></div>

      {/* --- FLOATING DECO SHAPES --- */}
      <div className="absolute top-20 right-[20%] animate-bounce duration-[3000ms] opacity-20 no-print">
         <Sparkles size={48} className="text-blue-600" />
      </div>
      <div className="absolute bottom-40 left-[15%] animate-bounce duration-[5000ms] opacity-20 no-print">
         <Zap size={32} className="text-indigo-600" />
      </div>

      {/* --- MAIN GLASS CARD --- */}
      <div className="relative z-10 w-full max-w-4xl px-6 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
        <div className="bg-white/40 backdrop-blur-3xl border border-white/40 p-12 md:p-24 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative overflow-hidden group">
          
          {/* Inner Light Beam */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

          {/* Premium Logo Icon */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl transform group-hover:rotate-6 transition-transform duration-500">
              <Snowflake size={72} strokeWidth={1.5} className="animate-spin-slow" />
            </div>
          </div>

          {/* Typography Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-blue-600/60 mb-2">
               Enterprise Resource Planning
            </h2>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              COLD<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800">STORE</span>
            </h1>
            <div className="h-1 w-24 bg-slate-900 mx-auto rounded-full mt-6"></div>
          </div>

          <p className="mt-10 text-slate-500 text-xl font-medium max-w-lg leading-relaxed">
            The intelligent backbone for your <span className="text-slate-900 font-bold">Cold Storage operations.</span> Manage stock, billing, and accounts with precision.
          </p>

          {/* Status Badge */}
          <div className="mt-12 flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-[3px] shadow-2xl hover:scale-105 transition-transform cursor-default">
             <ShieldCheck size={14} className="text-blue-400" />
             Secured Cloud Infrastructure
          </div>

        </div>
      </div>

      {/* --- FOOTER DECO --- */}
      <div className="mt-16 text-[10px] text-slate-400 font-black uppercase tracking-[8px] opacity-40">
         v2.0.4 • PREMIUM EDITION
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}



