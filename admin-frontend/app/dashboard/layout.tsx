"use client";

import Sidebar from "@/components/Sidebar";
import LoadingModal from "@/components/LoadingModal";
import { UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 bg-card/60 backdrop-blur-md border-b border-border flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
          <h2 className="font-semibold text-text/80 tracking-wide text-sm uppercase">Mentivo Platform Management</h2>
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              System Online
            </div>
            
            {/* Profile trigger button */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1 hover:bg-black/5 active:scale-95 rounded-full transition-all text-secondary flex items-center justify-center relative cursor-pointer"
            >
              <UserCircle size={28} className="text-primary-dark" />
            </button>

            {/* Profile dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="absolute right-0 top-12 w-64 bg-cardSolid border border-border shadow-premium rounded-2xl p-4 z-50 flex flex-col gap-3"
                >
                  <div className="border-b border-border pb-3">
                    <p className="text-xs text-secondary font-bold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-semibold text-text truncate mt-1">{user?.name || "Administrator"}</p>
                    <p className="text-xs text-secondary truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium group cursor-pointer"
                  >
                    <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm">Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
          <LoadingModal />
        </main>
      </div>
    </div>
  );
}