"use client";

import Link from "next/link";
import { UserCircle, ShieldAlert, TrendingUp } from "lucide-react";
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

export default function MentorsLanding() {
  const options = [
    {
      name: "Mentor Profile",
      description: "Browse verified and registered mentors, edit profile details, and set rates.",
      href: "/dashboard/profile/mentors/profile",
      icon: UserCircle,
      color: "blue"
    },
    {
      name: "Mentors Verification",
      description: "Review pending mentor registrations, identity documents, and verify access.",
      href: "/dashboard/profile/mentors/verification",
      icon: ShieldAlert,
      color: "amber"
    },
    {
      name: "Mentor Levels",
      description: "Configure system mentoring levels, pricing guidelines, and performance metrics.",
      href: "/dashboard/profile/mentors/levels",
      icon: TrendingUp,
      color: "green"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-text tracking-tight">Mentors Administration</h1>
        <p className="text-secondary mt-1 font-medium">Select a utility to manage mentor services</p>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const colorClasses = option.color === "blue" 
            ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600" 
            : option.color === "amber"
              ? "bg-amber-50 text-amber-600 group-hover:bg-amber-500"
              : "bg-green-50 text-green-600 group-hover:bg-green-600";
          
          return (
            <Link key={option.name} href={option.href}>
              <motion.div 
                variants={itemVars} 
                className="bg-cardSolid p-8 rounded-2xl border border-border shadow-premium hover:shadow-premium-hover hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group cursor-pointer h-full min-h-[220px]"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:text-white transition-all duration-300 mb-6 ${colorClasses}`}>
                  <Icon size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors">{option.name}</h2>
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
