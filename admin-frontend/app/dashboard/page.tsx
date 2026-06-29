"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, UserCheck, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/Skeleton";

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

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    students: 0,
    mentors: 0,
    unverifiedMentors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch stats from a dedicated endpoint.
    // For now, we can fetch lists to get counts.
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, mentorsRes, unverifiedRes] = await Promise.all([
          api.get("/students"),
          api.get("/mentors"),
          api.get("/mentors/unverified")
        ]);

        setStats({
          students: studentsRes.data.length,
          mentors: mentorsRes.data.length,
          unverifiedMentors: unverifiedRes.data.length,
        });
      } catch (err) {
        console.error("Failed to fetch overview stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">Overview</h1>
          <p className="text-secondary mt-1 font-medium">Platform performance and key metrics</p>
        </div>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVars} className="bg-cardSolid p-6 rounded-2xl border border-border shadow-premium hover:shadow-premium-hover transition-all duration-300 flex items-center gap-5 group cursor-default">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <Users size={28} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-1">Total Students</p>
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-black text-text">{stats.students}</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-cardSolid p-6 rounded-2xl border border-border shadow-premium hover:shadow-premium-hover transition-all duration-300 flex items-center gap-5 group cursor-default">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
            <UserCheck size={28} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-1">Total Mentors</p>
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-black text-text">{stats.mentors}</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-cardSolid p-6 rounded-2xl border border-border shadow-premium hover:shadow-premium-hover transition-all duration-300 flex items-center gap-5 group cursor-default">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <ShieldAlert size={28} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-1">Pending Verifications</p>
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-black text-text">{stats.unverifiedMentors}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-8 rounded-2xl relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
         <h2 className="text-xl font-bold text-primary-dark mb-3 relative z-10">Welcome to the Mentivo Admin Dashboard</h2>
         <p className="text-base text-secondary-dark leading-relaxed max-w-3xl relative z-10">
           Use the sidebar to navigate through the platform. You can manage student records, verify pending mentor applications by reviewing their submitted ID cards, and send bulk emails directly to specific user segments using the Email Center.
         </p>
      </motion.div>
    </div>
  );
}
