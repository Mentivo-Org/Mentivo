"use client";

import { useLoading } from "@/context/LoadingContext";
import { Loader2 } from "lucide-react";

export default function LoadingModal() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-text">Processing Request</h3>
          <p className="text-sm text-secondary">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
}
