"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, ShieldCheck, Mail, LogOut, LayoutDashboard, Bell, TrendingUp } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Mentors", href: "/dashboard/mentors", icon: ShieldCheck },
  { name: "Mentor Verification", href: "/dashboard/mentor-verification", icon: ShieldCheck },
  { name: "Mentor Levels", href: "/dashboard/mentor-levels", icon: TrendingUp },
  { name: "Email Center", href: "/dashboard/email", icon: Mail },
  { name: "Notification Center", href: "/dashboard/notifications", icon: Bell },
  { name: "Chat Moderation", href: "/dashboard/moderation", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-card border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <img src="/logo.svg" alt="Mentivo Logo" className="w-8 h-8" />
        <span className="font-bold text-lg text-text">Admin</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-secondary hover:bg-gray-100"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}