"use client";

import { useLoading } from "@/context/LoadingContext";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingModal() {
  const { isLoading } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-background/40 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 rounded-2xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-cardSolid border border-border rounded-2xl shadow-premium p-8 flex flex-col items-center gap-4 max-w-xs w-full text-center"
          >
            <div className="relative">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Loading Content</h3>
              <p className="text-xs text-secondary mt-1">Please wait a moment...</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
