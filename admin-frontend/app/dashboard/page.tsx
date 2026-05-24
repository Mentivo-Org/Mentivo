"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, UserCheck, ShieldAlert } from "lucide-react";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    students: 0,
    mentors: 0,
    unverifiedMentors: 0,
  });

  useEffect(() => {
    // In a real app, you'd fetch stats from a dedicated endpoint.
    // For now, we can fetch lists to get counts.
    const fetchStats = async () => {
      try {
        const [studentsRes, unverifiedRes] = await Promise.all([
          api.get("/students"),
          api.get("/mentors/unverified")
        ]);

        setStats({
          students: studentsRes.data.length,
          mentors: 0, // Placeholder
          unverifiedMentors: unverifiedRes.data.length,
        });
      } catch (err) {
        console.error("Failed to fetch overview stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Total Students</p>
            <p className="text-2xl font-bold text-text">{stats.students}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Active Mentors</p>
            <p className="text-2xl font-bold text-text">--</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Pending Verifications</p>
            <p className="text-2xl font-bold text-text">{stats.unverifiedMentors}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-xl">
         <h2 className="text-lg font-bold text-blue-800 mb-2">Welcome to the Mentivo Admin Dashboard</h2>
         <p className="text-sm text-blue-700 leading-relaxed">
           Use the sidebar to navigate through the platform. You can manage student records, verify pending mentor applications by reviewing their submitted ID cards, and send bulk emails directly to specific user segments using the Email Center.
         </p>
      </div>
    </div>
  );
}
