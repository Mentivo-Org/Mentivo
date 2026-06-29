"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Trash2, ShieldAlert, RefreshCw, AlertCircle, X, CheckSquare, Square } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

export default function ProfileDeletionPage() {
  const [role, setRole] = useState<"student" | "mentor">("student");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Target User Configuration Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [options, setOptions] = useState<any>({});

  // Confirmation step
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSelectedUser(null);
    setUserStats(null);
    if (!searchTerm.trim()) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchProfiles();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [role, searchTerm]);

  const fetchProfiles = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/profile-deletion/profiles?role=${role}&search=${encodeURIComponent(searchTerm)}`);
      setProfiles(data);
    } catch (err) {
      console.error("Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureDeletion = async (user: any) => {
    setSelectedUser(user);
    setLoadingStats(true);
    setUserStats(null);
    setOptions({});
    try {
      const { data } = await api.get(`/profile-deletion/profile/${user.id}/stats`);
      setUserStats(data.stats);
      
      // Select all existing records by default
      const initialOptions: any = {};
      Object.keys(data.stats).forEach((key) => {
        if (data.stats[key].exists) {
          initialOptions[key] = true;
        }
      });
      setOptions(initialOptions);
    } catch (err) {
      alert("Failed to analyze user database records.");
      setSelectedUser(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleOption = (key: string) => {
    setOptions({
      ...options,
      [key]: !options[key],
    });
  };

  const executeSelectiveDeletion = async () => {
    if (confirmInput.toUpperCase() !== "DELETE") {
      alert("Please type 'DELETE' to confirm.");
      return;
    }

    setIsDeleting(true);
    try {
      await api.post("/profile-deletion/delete", {
        id: selectedUser.id,
        role,
        options,
      });
      alert("Selected records deleted successfully.");
      setShowConfirmModal(false);
      setSelectedUser(null);
      setUserStats(null);
      setConfirmInput("");
      fetchProfiles();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process deletion. Check for database constraint issues.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Profile Deletion Center</h1>
          <p className="text-secondary text-sm mt-1">
            Search for a user to inspect and select specific database tables, credentials, or storage assets to delete.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setRole("student")}
          className={`px-6 py-3 font-semibold border-b-2 text-sm transition-colors ${
            role === "student"
              ? "border-primary text-primary"
              : "border-transparent text-secondary hover:text-text"
          }`}
        >
          Students
        </button>
        <button
          onClick={() => setRole("mentor")}
          className={`px-6 py-3 font-semibold border-b-2 text-sm transition-colors ${
            role === "mentor"
              ? "border-primary text-primary"
              : "border-transparent text-secondary hover:text-text"
          }`}
        >
          Mentors
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${role}s by name, email, or phone...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchProfiles}
            disabled={!searchTerm.trim()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-secondary disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-secondary text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Date Joined</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-32 ml-auto" /></td>
                  </tr>
                ))
              ) : !searchTerm.trim() ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-secondary">
                    Type a query to search profiles...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-secondary">
                    No {role} profiles found.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text">{profile.name || "N/A"}</div>
                      <div className="text-xs text-secondary">{profile.email}</div>
                      <div className="text-xs text-secondary mt-0.5">{profile.phone || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleConfigureDeletion(profile)}
                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Configure Deletion
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-text">Inspect & Configure Deletion</h2>
                <p className="text-xs text-secondary mt-0.5">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingStats ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ) : !userStats ? (
                <div className="py-12 text-center text-red-600 text-sm flex flex-col items-center gap-2">
                  <AlertCircle size={24} />
                  <span>Failed to analyze user data.</span>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-xs space-y-1">
                      <h4 className="font-semibold">Important Deletion Guard</h4>
                      <p>
                        Checkboxes are generated dynamically for areas where this user has active records.
                      </p>
                      <p className="font-medium text-red-700">
                        Warning: If you delete the User Profile Record but do not delete dependent constraint tables (like Call Sessions or Chats), database integrity checks may cause the deletion to fail.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-xs text-secondary uppercase tracking-wider">
                      Tables & Elements containing data:
                    </h3>
                    
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {Object.keys(userStats).map((key) => {
                        const stat = userStats[key];
                        if (!stat.exists) return null;
                        const isChecked = !!options[key];
                        const isCritical = key === "profile" || key === "auth";

                        return (
                          <button
                            key={key}
                            onClick={() => toggleOption(key)}
                            className={`w-full flex items-center justify-between p-3 text-left transition-colors text-sm ${
                              isChecked ? "bg-white hover:bg-gray-50" : "bg-gray-100/50 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isChecked ? (
                                <CheckSquare className="text-primary flex-shrink-0" size={20} />
                              ) : (
                                <Square className="text-gray-400 flex-shrink-0" size={20} />
                              )}
                              <div>
                                <span className={`font-semibold ${isCritical ? "text-red-600" : "text-text"}`}>
                                  {stat.label}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-gray-100 text-secondary text-xs rounded border border-gray-200">
                              Active
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white text-secondary font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingStats || !userStats || Object.values(options).filter(Boolean).length === 0}
                onClick={() => setShowConfirmModal(true)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 disabled:opacity-50 disabled:shadow-none"
              >
                <Trash2 size={16} />
                <span>Configure Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Trash2 size={24} />
                <span>Verify & Confirm Deletion</span>
              </h2>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (confirmInput.toUpperCase() === "DELETE" && !isDeleting) {
                  executeSelectiveDeletion();
                }
              }}
              className="p-6 space-y-4"
            >
              <p className="text-sm text-secondary">
                You are about to delete records from <strong className="text-text">{Object.values(options).filter(Boolean).length}</strong> selected table(s) for <strong className="text-text">{selectedUser?.name}</strong>.
              </p>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-xs text-red-800 font-medium">
                To proceed, type <span className="underline font-bold">DELETE</span> below.
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Type DELETE"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-600"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmInput("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-secondary font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmInput.toUpperCase() !== "DELETE" || isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
