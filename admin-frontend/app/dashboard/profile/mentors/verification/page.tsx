"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CheckCircle, XCircle, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import dynamic from "next/dynamic";

// Dynamically import the viewer with SSR disabled to prevent ReferenceError: DOMMatrix is not defined
const MentorDocumentViewer = dynamic(
  () => import("@/components/MentorDocumentViewer"),
  { ssr: false }
);

export default function MentorVerificationPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUnverifiedMentors();
  }, []);

  const fetchUnverifiedMentors = async () => {
    try {
      const { data } = await api.get("/mentors/unverified");
      setMentors(data);
    } catch (err) {
      console.error("Failed to fetch unverified mentors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!confirm("Are you sure you want to verify this mentor?")) return;
    setVerifyingId(id);
    try {
      await api.post(`/mentors/${id}/verify`, {});
      setMentors(mentors.filter(m => m.mentorId !== id));
    } catch (err) {
      alert("Failed to verify mentor.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this mentor application?")) return;
    setVerifyingId(id);
    try {
      await api.post(`/mentors/${id}/reject`, {});
      setMentors(mentors.filter(m => m.mentorId !== id));
    } catch (err) {
      alert("Failed to reject mentor application.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">Mentor Verification Portal</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
              <div className="p-6 border-b border-gray-100 flex gap-4">
                <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex-1 space-y-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="bg-card p-12 rounded-xl border border-gray-200 text-center space-y-4 shadow-sm">
           <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
             <CheckCircle size={32} />
           </div>
           <h2 className="text-xl font-bold text-text">All Caught Up!</h2>
           <p className="text-secondary">There are no mentors waiting for verification at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.mentorId} className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 font-bold text-xl uppercase">
                   {mentor.user?.name?.charAt(0) || "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-text truncate">{mentor.user?.name}</h2>
                  <p className="text-secondary text-sm truncate">{mentor.user?.email}</p>
                  <p className="text-primary text-sm font-semibold">{mentor.iit_name} • {mentor.branch}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase border border-amber-100">Pending</span>
                   <p className="text-xs text-gray-400 mt-2">Year: {mentor.year}</p>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 flex-1 space-y-4">
                 <div>
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Bio & Expertise</h3>
                    <p className="text-sm text-text line-clamp-3 italic">"{mentor.bio || "No bio provided."}"</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {mentor.expertise?.split(',').map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-full">{tag.trim()}</span>
                        ))}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Identity Document</h3>
                    {mentor.id_doc_url ? (
                        <MentorDocumentViewer mentorId={mentor.mentorId} />
                    ) : (
                        <div className="p-4 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                           <XCircle size={14} /> No ID document uploaded.
                        </div>
                    )}
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                 <button 
                   onClick={() => handleReject(mentor.mentorId)}
                   disabled={verifyingId === mentor.mentorId}
                   className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 rounded-lg transition-colors text-sm"
                 >
                    Reject Application
                 </button>
                 <button 
                   onClick={() => handleVerify(mentor.mentorId)}
                   disabled={verifyingId === mentor.mentorId}
                   className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                 >
                    <UserCheck size={18} /> {verifyingId === mentor.mentorId ? "Verifying..." : "Approve & Verify"}
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
