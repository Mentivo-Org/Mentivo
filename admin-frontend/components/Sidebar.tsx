"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldCheck, Mail, LayoutDashboard, Bell, TrendingUp, UserMinus, Share2, Settings, Terminal, Database, Ticket } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/dashboard/profile", icon: Users },
  { name: "Partner Referrals", href: "/dashboard/partners", icon: Share2 },
  { name: "Vouchers", href: "/dashboard/vouchers", icon: Ticket },
  { name: "Communication", href: "/dashboard/communication", icon: Mail },
  { name: "Deletion Hub", href: "/dashboard/deletion-hub", icon: UserMinus, isRed: true },
  { name: "Developer Options", href: "/dashboard/developer-options", icon: Database },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-xl border-r border-border flex flex-col h-full shadow-glass relative z-20">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <img src="/logo.svg" alt="Mentivo Logo" className="w-8 h-8 drop-shadow-sm" />
        <span className="font-black text-xl text-text tracking-tight">Admin</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Robust nested route matching: Overview strictly matches /dashboard, others match startsWith.
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.name} href={item.href} className="block relative">
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-xl shadow-premium-hover"
                  animate={{ backgroundColor: item.isRed ? "#ef4444" : "#0077CB" }}
                  initial={{ backgroundColor: item.isRed ? "#ef4444" : "#0077CB" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 z-10",
                  isActive 
                    ? "text-white font-semibold" 
                    : item.isRed
                      ? "text-red-500 hover:text-red-600 hover:bg-red-500/5 font-medium"
                      : "text-secondary hover:text-text hover:bg-primary/5 font-medium"
                )}
              >
                <Icon size={20} className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}