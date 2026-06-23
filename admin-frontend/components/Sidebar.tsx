"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldCheck, Mail, LayoutDashboard, Bell, TrendingUp, UserMinus, Share2, Settings } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Mentors", href: "/dashboard/mentors", icon: ShieldCheck },
  { name: "Mentor Verification", href: "/dashboard/mentor-verification", icon: ShieldCheck },
  { name: "Mentor Levels", href: "/dashboard/mentor-levels", icon: TrendingUp },
  { name: "Partner Referrals", href: "/dashboard/partners", icon: Share2 },
  { name: "Email Center", href: "/dashboard/email", icon: Mail },
  { name: "Notification Center", href: "/dashboard/notifications", icon: Bell },
  { name: "Chat Moderation", href: "/dashboard/moderation", icon: ShieldCheck },
  { name: "Profile Deletion", href: "/dashboard/profile-deletion", icon: UserMinus },
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
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="block relative">
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary rounded-xl shadow-premium-hover"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 z-10",
                  isActive 
                    ? "text-white font-semibold" 
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