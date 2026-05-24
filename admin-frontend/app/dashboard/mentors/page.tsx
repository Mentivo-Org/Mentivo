"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMentors(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchMentors = async (query = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/mentors?search=${encodeURIComponent(query)}`);
      setMentors(data);
    } catch (err) {
      console.error("Failed to fetch mentors");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">Mentor Directory</h1>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search mentors by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-secondary text-sm font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Mentor</th>
              <th className="px-6 py-4">Institution & Branch</th>
              <th className="px-6 py-4">Rate/Min</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary">Loading mentors...</td></tr>
            ) : mentors.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary">No mentors found.</td></tr>
            ) : mentors.map((mentor) => (
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
                  <p className="text-sm font-medium text-text">{mentor.iit_name}</p>
                  <p className="text-xs text-secondary">{mentor.branch} • Year {mentor.year}</p>
                </td>
                <td className="px-6 py-4 text-text font-medium">
                  ₹{mentor.rate_per_min}
                </td>
                <td className="px-6 py-4">
                  {mentor.verified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase border border-green-100">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase border border-amber-100">
                      <ShieldAlert size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-secondary">
                  {new Date(mentor.user?.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
