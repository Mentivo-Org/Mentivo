"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Send, Users, Mail, AlertTriangle, UserPlus, X, Paperclip } from "lucide-react";

interface UserSuggestion {
  email: string;
  name: string;
  role: string;
}

export default function EmailCenterPage() {
  const { user: admin } = useAuth();
  const [mode, setMode] = useState<"group" | "specific">("group");
  const [filters, setFilters] = useState<any>({ role: "", grade: "", verified: undefined });

  // Specific Recipients State
  const [searchText, setSearchText] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [recipientCount, setCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (mode === "group") {
      updateCount();
    } else {
      setCount(selectedUsers.length);
    }
  }, [filters, mode, selectedUsers]);

  // Debounced user search
  useEffect(() => {
    // If we're not in single mode, or input is too short
    if (mode !== "specific" || searchText.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setFocusedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/email/search-users?q=${searchText}`, {
          hideLoading: true
        } as any);
        
        // Filter out already selected users
        const filtered = data.filter((u: UserSuggestion) => !selectedUsers.some(s => s.email === u.email));
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
      const { data } = await api.post("/email/preview-group", { filters }, {
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
    if (!selectedUsers.some(u => u.email === user.email)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchText("");
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  const handleRemoveUser = (email: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.email !== email));
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

    if (!confirm(`Are you sure you want to send this email to ${count} recipient(s)?`)) return;
    
    setLoading(true);
    try {
      const endpoint = mode === "group" ? "/email/send-group" : "/email/send-batch";
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("isHtml", isHtml.toString());
      
      if (mode === "group") {
        formData.append("filters", JSON.stringify(filters));
      } else {
        formData.append("emails", JSON.stringify(selectedUsers.map(u => u.email)));
      }

      attachments.forEach(file => {
        formData.append("attachments", file);
      });

      await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert("Email(s) sent successfully!");
      if (mode === "specific") {
        setSelectedUsers([]);
        setSearchText("");
      }
      setSubject("");
      setBody("");
      setAttachments([]);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to send email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Mail className="text-primary" /> Email Communications Hub
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
                                    key={u.email}
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
                          <div key={user.email} className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded-lg group">
                              <div className="min-w-0">
                                  <p className="text-xs font-bold text-blue-900 truncate">{user.name}</p>
                                  <p className="text-[10px] text-blue-700 truncate">{user.email}</p>
                              </div>
                              <button 
                                onClick={() => handleRemoveUser(user.email)}
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
               <strong>Important:</strong> Emails are sent using Resend. Ensure your content complies with anti-spam policies. An admin signature will be automatically appended.
             </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSend} className="bg-card p-8 rounded-xl border border-gray-200 shadow-sm space-y-6 flex flex-col h-full">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Email Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Important update regarding your account"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-text">Message Body</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
                        <input type="checkbox" checked={isHtml} onChange={e => setIsHtml(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                        Send as HTML
                      </label>
                      {isHtml && (
                        <div className="flex bg-gray-100 p-0.5 rounded-md">
                           <button type="button" onClick={() => setPreviewMode(false)} className={`px-2 py-1 text-[10px] font-bold rounded ${!previewMode ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Code</button>
                           <button type="button" onClick={() => setPreviewMode(true)} className={`px-2 py-1 text-[10px] font-bold rounded ${previewMode ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Preview</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isHtml && previewMode ? (
                    <div 
                      className="flex-1 min-h-[280px] p-4 bg-white border border-gray-300 rounded-lg overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: body || '<span class="text-gray-400">Empty preview...</span>' }}
                    />
                  ) : (
                    <textarea
                      required={!previewMode}
                      rows={12}
                      placeholder={isHtml ? "<h1>Write your HTML message here...</h1>" : "Write your message here..."}
                      className="w-full flex-1 min-h-[280px] px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all font-sans resize-none"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1 flex items-center gap-2">
                    <Paperclip size={16} /> Attachments
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setAttachments([...attachments, ...newFiles]);
                        // Reset input so same file can be selected again if removed...
                        e.target.value = '';
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-all cursor-pointer"
                  />
                  {attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachments.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs border border-gray-200">
                          <span className="truncate max-w-[150px] font-medium" title={f.name}>{f.name}</span>
                          <button type="button" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Signature Preview</p>
                    <p className="text-sm text-secondary whitespace-pre-line">
                        --{"\n"}
                        Mentivo Admin Team{isHtml ? <br /> : "\n"}
                        {admin?.email || "admin@mentivo.in"}
                    </p>
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
