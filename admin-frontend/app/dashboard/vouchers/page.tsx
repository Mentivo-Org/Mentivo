"use client";

import { useState } from "react";
import { Ticket, Search, CheckCircle2, XCircle, Send } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface UserResult {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  voucherEligible: boolean;
  voucherSubscriptions: any[];
}

export default function VouchersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 3) {
      toast.error("Enter at least 3 characters");
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.get(`/vouchers/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleEligibility = async (userId: string, currentStatus: boolean) => {
    try {
      await api.post('/vouchers/set-eligible', { userId, eligible: !currentStatus });
      setResults((prev) => 
        prev.map((u) => u.id === userId ? { ...u, voucherEligible: !currentStatus } : u)
      );
      toast.success(`User is now ${!currentStatus ? 'eligible' : 'ineligible'} for vouchers`);
    } catch (err) {
      toast.error("Failed to update eligibility");
    }
  };

  const sendInvite = async (userId: string) => {
    try {
      await api.post('/vouchers/send-invite', { userId });
      toast.success("Voucher invite email sent successfully");
      // Optimistically update eligibility if it was false
      setResults((prev) => 
        prev.map((u) => u.id === userId ? { ...u, voucherEligible: true } : u)
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send invite");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Ticket size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Voucher Management</h1>
          <p className="text-secondary text-sm">Manage student voucher eligibility and send invites.</p>
        </div>
      </div>

      <div className="bg-cardSolid border border-border rounded-2xl p-6 shadow-premium">
        <form onSubmit={searchUsers} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search students by name, email, or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || query.length < 3}
            className="px-6 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {results.length === 0 && !loading && query.length > 2 && (
            <div className="text-center py-8 text-secondary">
              No students found matching your search.
            </div>
          )}

          {results.map((userResult) => (
            <div key={userResult.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border border-border rounded-xl bg-background hover:border-primary/30 transition-colors">
              <div>
                <h3 className="font-semibold text-text">{userResult.name || 'Unknown Name'}</h3>
                <p className="text-sm text-secondary">{userResult.email || 'No email'}</p>
                <p className="text-sm text-secondary">{userResult.phone || 'No phone'}</p>
                
                {userResult.voucherSubscriptions.length > 0 && (
                  <div className="mt-2 text-xs text-primary font-medium">
                    {userResult.voucherSubscriptions.length} Active Subscription(s)
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => toggleEligibility(userResult.id, userResult.voucherEligible)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    userResult.voucherEligible
                      ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {userResult.voucherEligible ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {userResult.voucherEligible ? "Eligible" : "Not Eligible"}
                </button>
                
                <button
                  onClick={() => sendInvite(userResult.id)}
                  disabled={!userResult.email}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  title="Send Invite Email"
                >
                  <Send size={16} />
                  Send Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
