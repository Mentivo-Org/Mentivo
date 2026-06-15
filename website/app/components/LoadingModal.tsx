"use client";

import { useLoading } from "@/context/LoadingContext";
import { Loader2 } from "lucide-react";

export default function LoadingModal() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-200 max-w-xs w-full text-center">
        <div className="relative">
          <Loader2 className="w-14 h-14 text-[#0077CB] animate-spin" />
          <div className="absolute inset-0 border-4 border-[#0077CB]/10 rounded-full"></div>
        </div>
        <div>
          <h3 className="text-xl font-black text-[#0b1c30] tracking-tight">Hang Tight</h3>
          <p className="text-slate-500 font-medium mt-1">Connecting to Mentivo...</p>
        </div>
      </div>
    </div>
  );
}
