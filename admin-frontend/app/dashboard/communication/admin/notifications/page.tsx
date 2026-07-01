"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Send, Users, Bell, AlertTriangle, UserPlus, X } from "lucide-react";

interface UserSuggestion {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function NotificationCenterPage() {
  const { user: admin } = useAuth();
  const [mode, setMode] = useState<"group" | "specific">("group");
  const [filters, setFilters] = useState<any>({ role: "", grade: "", verified: undefined });
  const [priority, setPriority] = useState<"normal" | "high">("normal");

  // Specific Recipients State
  const [searchText, setSearchText] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [recipientCount, setCount] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [counting, setCounting] = useState(false);
  const [actionType, setActionType] = useState<"none" | "IN_APP" | "EXTERNAL_URL">("none");
  const [actionTarget, setActionTarget] = useState("");

  useEffect(() => {
    if (mode === "group") {
      updateCount();
    } else {
      setCount(selectedUsers.length);
    }
  }, [filters, mode, selectedUsers]);

  // Debounced user search
  useEffect(() => {
    if (mode !== "specific" || searchText.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setFocusedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/notifications/search-users?q=${searchText}`, {
          hideLoading: true
        } as any);
        
        // Filter out already selected users
        const filtered = data.filter((u: UserSuggestion) => !selectedUsers.some(s => s.id === u.id));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setFocusedIndex(-1);
      } catch (err) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, mode, selectedUsers]);

  const updateCount = async () => {
    setCounting(true);
    try {
      const { data } = await api.post("/notifications/preview-group", { filters }, {
        hideLoading: true
      } as any);
      setCount(data.count);
    } catch (err) {
      console.error("Failed to count recipients");
    } finally {
      setCounting(false);
    }
  };

  const handleSelectUser = (user: UserSuggestion) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchText("");
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  const handleRemoveUser = (id: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelectUser(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = mode === "group" ? recipientCount : selectedUsers.length;

    if (!confirm(`Are you sure you want to send this ${priority} priority notification to ${count} recipient(s)?`)) return;
    
    setLoading(true);
    try {
      const endpoint = mode === "group" ? "/notifications/send-group" : "/notifications/send-batch";
      const payload = mode === "group" 
        ? { filters, title, body, priority, actionType: actionType === "none" ? null : actionType, actionTarget: actionType === "none" ? null : actionTarget } 
        : { userIds: selectedUsers.map(u => u.id), title, body, priority, actionType: actionType === "none" ? null : actionType, actionTarget: actionType === "none" ? null : actionTarget };

      await api.post(endpoint, payload);
      
      alert("Notification(s) sent successfully!");
      if (mode === "specific") {
        setSelectedUsers([]);
        setSearchText("");
      }
      setTitle("");
      setBody("");
      setActionType("none");
      setActionTarget("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Bell className="text-primary" /> Notification Center
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
             <h2 className="font-bold text-text flex items-center gap-2 text-sm uppercase tracking-wider">
               <Users size={16} className="text-secondary" /> Recipient Mode
             </h2>

             <div className="flex p-1 bg-gray-100 rounded-lg">
                <button 
                  onClick={() => setMode("group")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${mode === "group" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-text"}`}
                >
                  <Users size={14} /> Group
                </button>
                <button 
                  onClick={() => setMode("specific")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${mode === "specific" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-text"}`}
                >
                  <UserPlus size={14} /> Specific
                </button>
             </div>
             
             {mode === "group" ? (
               <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">User Role</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={filters.role}
                      onChange={(e) => setFilters({...filters, role: e.target.value})}
                    >
                      <option value="">All Users</option>
                      <option value="student">Students Only</option>
                      <option value="mentor">Mentors Only</option>
                    </select>
                  </div>

                  {filters.role === "student" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={filters.grade}
                        onChange={(e) => setFilters({...filters, grade: e.target.value})}
                      >
                        <option value="">All Grades</option>
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                        <option value="Dropper">Dropper</option>
                      </select>
                    </div>
                  )}

                  {filters.role === "mentor" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={filters.verified === undefined ? "" : filters.verified.toString()}
                        onChange={(e) => setFilters({...filters, verified: e.target.value === "" ? undefined : e.target.value === "true"})}
                      >
                        <option value="">All Mentors</option>
                        <option value="true">Verified Only</option>
                        <option value="false">Unverified Only</option>
                      </select>
                    </div>
                  )}
               </div>
             ) : (
               <div className="space-y-4 pt-2">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search & Add Users</label>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Type name or email..."
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isSearching && (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    </div>

                    {showSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {suggestions.map((u, index) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${focusedIndex === index ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                    onClick={() => handleSelectUser(u)}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                >
                                    <div className="font-bold text-sm text-text">{u.name}</div>
                                    <div className="text-[10px] text-secondary flex justify-between">
                                        <span>{u.email}</span>
                                        <span className="uppercase font-bold text-primary">{u.role}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded-lg group">
                              <div className="min-w-0">
                                  <p className="text-xs font-bold text-blue-900 truncate">{user.name}</p>
                                  <p className="text-[10px] text-blue-700 truncate">{user.email}</p>
                              </div>
                              <button 
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-blue-400 hover:text-red-500 transition-colors p-1"
                              >
                                <X size={14} />
                              </button>
                          </div>
                      ))}
                      {selectedUsers.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
                              <p className="text-[10px] text-gray-400">No users selected yet.</p>
                          </div>
                      )}
                  </div>
               </div>
             )}

             <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs text-secondary">Total Recipients:</span>
                   {counting && <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
                </div>
                <div className="text-3xl font-bold text-primary">{recipientCount ?? 0}</div>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
             <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
             <p className="text-xs text-amber-800 leading-relaxed">
               <strong>Note:</strong> Notifications are sent as Push Alerts (FCM) and stored in the user's in-app inbox. High priority notifications bypass battery saving modes on Android.
             </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSend} className="bg-card p-8 rounded-xl border border-gray-200 shadow-sm space-y-6 flex flex-col h-full">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Notification Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., New Mentor Available!"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-text mb-1">Notification Body</label>
                  <textarea
                    required
                    rows={10}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all font-sans resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-1">Priority Level</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "normal" | "high")}
                    >
                      <option value="normal">Normal Priority (Recommended for standard alerts)</option>
                      <option value="high">High Priority (Use for critical/urgent time-sensitive alerts)</option>
                    </select>
                    <p className="text-[10px] text-secondary mt-1 ml-1 italic">
                        High priority should be used sparingly to respect user battery and delivery policies.
                    </p>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-text">Click Action Routing</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                        <input 
                          type="radio" 
                          name="actionType" 
                          value="none" 
                          checked={actionType === "none"} 
                          onChange={() => setActionType("none")}
                        />
                        None (Just open app)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                        <input 
                          type="radio" 
                          name="actionType" 
                          value="IN_APP" 
                          checked={actionType === "IN_APP"} 
                          onChange={() => setActionType("IN_APP")}
                        />
                        Open App Screen
                      </label>
                      <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                        <input 
                          type="radio" 
                          name="actionType" 
                          value="EXTERNAL_URL" 
                          checked={actionType === "EXTERNAL_URL"} 
                          onChange={() => setActionType("EXTERNAL_URL")}
                        />
                        Open External URL
                      </label>
                    </div>
                  </div>

                  {actionType !== "none" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {actionType === "IN_APP" ? "Target App Screen Name" : "Target External URL"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={actionType === "IN_APP" ? "e.g., Wallet, MentorProfile, Ask" : "e.g., https://mentivo.in/blog/guide"}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                        value={actionTarget}
                        onChange={(e) => setActionTarget(e.target.value)}
                      />
                      <p className="text-[10px] text-secondary mt-1 ml-1 italic">
                        {actionType === "IN_APP" 
                          ? "Enter the exact route/screen name specified in RootNavigator.tsx (case-sensitive)." 
                          : "Must start with http:// or https://."}
                      </p>
                    </div>
                  )}
                </div>
             </div>

             <button
               type="submit"
               disabled={loading || !recipientCount}
               className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 mt-auto"
             >
               <Send size={18} /> {loading ? "Sending..." : `Send to ${recipientCount || 0} Recipient${recipientCount !== 1 ? 's' : ''}`}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
}
