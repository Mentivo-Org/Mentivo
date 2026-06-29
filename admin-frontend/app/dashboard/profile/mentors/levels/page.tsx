"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TrendingUp, Save, UserCheck, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

const LEVELS = ["Standard", "Signature", "Fellow"];

export default function MentorLevelsPage() {
  const [conditions, setConditions] = useState<any[]>([]);
  const [eligibleFellows, setEligibleFellows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [condRes, fellowRes] = await Promise.all([
        api.get("/mentors/promotion-conditions"),
        api.get("/mentors/eligible-fellows"),
      ]);
      setConditions(condRes.data);
      setEligibleFellows(fellowRes.data);
    } catch (err) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCondition = async (level: string, minCalls: number, minRating: number) => {
    try {
      await api.put("/mentors/promotion-conditions", { level, minCalls, minRating });
      alert(`${level} conditions updated successfully`);
      fetchData();
    } catch (err) {
      alert("Failed to update conditions");
    }
  };

  const promoteToFellow = async (mentorId: string) => {
    if (!confirm("Are you sure you want to promote this mentor to Fellow level?")) return;
    setPromotingId(mentorId);
    try {
      await api.post(`/mentors/${mentorId}/promote-fellow`);
      alert("Mentor promoted to Fellow level successfully");
      fetchData();
    } catch (err) {
      alert("Failed to promote mentor");
    } finally {
      setPromotingId(null);
    }
  };

  const getCondition = (level: string) => {
    return conditions.find((c) => c.level === level) || { level, minCalls: 0, minRating: 0 };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <TrendingUp size={24} /> Mentor Levels Management
        </h1>
      </div>

      {/* Promotion Conditions Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Promotion Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEVELS.map((level) => {
            const cond = getCondition(level);
            return (
              <ConditionCard
                key={level}
                level={level}
                initialCalls={cond.minCalls}
                initialRating={Number(cond.minRating)}
                onSave={(calls: any, rating: any) => handleUpdateCondition(level, calls, rating)}
                loading={loading}
              />
            );
          })}
        </div>
      </section>

      {/* Eligible Fellows Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Eligible for Fellow Level</h2>
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-secondary text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Mentor</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Current Level</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                 [...Array(3)].map((_, i) => (
                   <tr key={i}>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <Skeleton className="w-10 h-10 rounded-full" />
                         <div className="space-y-2">
                           <Skeleton className="h-4 w-28" />
                           <Skeleton className="h-3 w-36" />
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <Skeleton className="h-4 w-16 mb-2" />
                       <Skeleton className="h-3 w-12" />
                     </td>
                     <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                     <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-32 ml-auto" /></td>
                   </tr>
                 ))
              ) : eligibleFellows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-secondary">No eligible mentors found for Fellow promotion.</td></tr>
              ) : eligibleFellows.map((mentor) => (
                <tr key={mentor.mentorId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {mentor.user?.name?.charAt(0) || "M"}
                      </div>
                      <div>
                        <p className="font-medium text-text">{mentor.user?.name}</p>
                        <p className="text-xs text-secondary">{mentor.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-text font-medium">{mentor.total_calls} Calls</p>
                    <p className="text-xs text-secondary">{Number(mentor.avg_rating).toFixed(1)} Rating</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                      {mentor.mentorlevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => promoteToFellow(mentor.mentorId)}
                      disabled={promotingId === mentor.mentorId}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {promotingId === mentor.mentorId ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <UserCheck size={16} />
                      )}
                      Promote to Fellow
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ConditionCard({ level, initialCalls, initialRating, onSave, loading }: any) {
  const [calls, setCalls] = useState(initialCalls);
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    setCalls(initialCalls);
    setRating(initialRating);
  }, [initialCalls, initialRating]);

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="h-4 bg-slate-200 rounded-full w-24" />
        <div className="space-y-3">
          <div>
            <div className="h-3 bg-slate-200 rounded-full w-16 mb-2" />
            <div className="h-10 bg-slate-100 rounded-lg w-full" />
          </div>
          <div>
            <div className="h-3 bg-slate-200 rounded-full w-16 mb-2" />
            <div className="h-10 bg-slate-100 rounded-lg w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-text uppercase tracking-wide text-sm">{level} Requirements</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">MIN CALLS</label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={calls}
            onChange={(e) => setCalls(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">MIN RATING</label>
          <input
            type="number"
            step="0.1"
            max="5"
            min="0"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
          />
        </div>
      </div>
      <button
        onClick={() => onSave(calls, rating)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-bold rounded-lg hover:bg-secondary/90 transition-colors"
      >
        <Save size={16} /> Save Changes
      </button>
    </div>
  );
}
