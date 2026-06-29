"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, ShieldCheck, ShieldAlert, CheckCircle2, Edit2, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import dynamic from "next/dynamic";

const MentorDocumentViewer = dynamic(
  () => import("@/components/MentorDocumentViewer"),
  { ssr: false }
);

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit & Delete State
  const [editingMentor, setEditingMentor] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    iit_name: "",
    branch: "",
    year: "",
    bio: "",
    expertise: "",
    rate_per_min: ""
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEditClick = (mentor: any) => {
    setEditingMentor(mentor);
    setEditForm({
      name: mentor.user?.name || "",
      phone: mentor.user?.phone || "",
      iit_name: mentor.iit_name || "",
      branch: mentor.branch || "",
      year: mentor.year !== null && mentor.year !== undefined ? mentor.year.toString() : "",
      bio: mentor.bio || "",
      expertise: mentor.expertise || "",
      rate_per_min: mentor.rate_per_min !== null && mentor.rate_per_min !== undefined ? mentor.rate_per_min.toString() : ""
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMentor) return;

    setIsSaving(true);
    try {
      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        branch: editForm.branch,
        year: editForm.year ? parseInt(editForm.year) : null,
        bio: editForm.bio,
        expertise: editForm.expertise,
        rate_per_min: editForm.rate_per_min ? parseFloat(editForm.rate_per_min) : 0
      };

      const { data } = await api.put(`/mentors/${editingMentor.mentorId}`, payload);
      
      // Update local state by merging old mentor (which contains user data) with the new mentor data
      setMentors(mentors.map(m => m.mentorId === editingMentor.mentorId ? { ...m, ...data } : m));
      setEditingMentor(null);
    } catch (err) {
      alert("Failed to update mentor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mentor? This will remove them from both Firebase Auth and Prisma DB. This action cannot be undone.")) return;
    try {
      await api.delete(`/mentors/${id}`);
      setMentors(mentors.filter(m => m.mentorId !== id));
    } catch (err) {
      alert("Failed to delete mentor.");
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
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-12" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : mentors.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-secondary">No mentors found.</td></tr>
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
                  {mentor.verificationStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase border border-green-100">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : mentor.verificationStatus === 'REJECTED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase border border-red-100">
                      <ShieldAlert size={12} /> Rejected
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
                <td className="px-6 py-4 text-right space-x-3">
                  <button 
                    onClick={() => handleEditClick(mentor)}
                    className="text-primary hover:text-primary-dark inline-flex items-center"
                    title="Edit Mentor"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(mentor.mentorId)}
                    className="text-red-500 hover:text-red-700 inline-flex items-center"
                    title="Delete Mentor"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-text">Edit Mentor Profile</h2>
                <p className="text-sm text-secondary">{editingMentor.user?.name} ({editingMentor.user?.email})</p>
              </div>
              <button 
                onClick={() => setEditingMentor(null)}
                className="text-gray-400 hover:text-text transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">College Name (Cannot be changed)</label>
                    <input
                      type="text"
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg outline-none cursor-not-allowed text-gray-500 font-medium"
                      value={editForm.iit_name}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Branch</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text"
                      value={editForm.branch}
                      onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Year</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text"
                        value={editForm.year}
                        onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Rate per Min (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text"
                        value={editForm.rate_per_min}
                        onChange={(e) => setEditForm({...editForm, rate_per_min: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Expertise (Comma separated)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text"
                      placeholder="Physics, Calculus, Organic Chemistry"
                      value={editForm.expertise}
                      onChange={(e) => setEditForm({...editForm, expertise: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Bio</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text resize-none"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    />
                  </div>
                </div>

                {/* Verification Document Viewer */}
                <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
                  <div className="space-y-4 flex-1">
                    <h3 className="font-semibold text-text text-sm">Identity & Document Review</h3>
                    <p className="text-xs text-secondary">
                      Verify the mentor's document matches their IIT details. The verification status and ID document URL cannot be modified here.
                    </p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2 max-h-[320px] overflow-y-auto">
                      {editingMentor.id_doc_url ? (
                        <MentorDocumentViewer mentorId={editingMentor.mentorId} />
                      ) : (
                        <div className="p-4 text-center text-sm text-secondary">
                          No identity document uploaded by this mentor.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-6 flex gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => setEditingMentor(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-secondary font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
