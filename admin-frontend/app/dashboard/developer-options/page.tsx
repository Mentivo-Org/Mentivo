"use client";

import Link from "next/link";
import { Terminal, Database } from "lucide-react";
import { motion } from "framer-motion";

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DeveloperOptionsLanding() {
  const options = [
    {
      name: "System Logs",
      description: "Inspect diagnostic platform runtime logs, track server errors, and check active events.",
      href: "/dashboard/developer-options/logs",
      icon: Terminal,
      color: "blue"
    },
    {
      name: "Database Console",
      description: "Inspect primary schemas, perform raw query diagnostics, and review data records.",
      href: "/dashboard/developer-options/database",
      icon: Database,
      color: "green"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-text tracking-tight">Developer Tools</h1>
        <p className="text-secondary mt-1 font-medium">Diagnostic utilities and live system consoles</p>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const colorClasses = option.color === "blue" 
            ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600" 
            : "bg-green-50 text-green-600 group-hover:bg-green-600";
          
          return (
            <Link key={option.name} href={option.href}>
              <motion.div 
                variants={itemVars} 
                className="bg-cardSolid p-8 rounded-2xl border border-border shadow-premium hover:shadow-premium-hover hover:border-primary/20 transition-all duration-300 flex items-center gap-6 group cursor-pointer h-full"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:text-white transition-all duration-300 ${colorClasses}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text mb-1 group-hover:text-primary transition-colors">{option.name}</h2>
                  <p className="text-secondary text-sm leading-relaxed">{option.description}</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
