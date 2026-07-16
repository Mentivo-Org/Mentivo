"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Search, AlertTriangle, CheckCircle, RefreshCcw, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/Skeleton";

interface AuditResult {
  sessionId: string;
  studentId: string;
  mentorId: string;
  durationSecs: number;
  settledAt: string;
  stored: { amountCharged: number; mentorEarning: number; platformFee: number };
  expected: { amountCharged: number; mentorEarning: number; platformFee: number };
  delta: { studentDebit: number; mentorCredit: number; coachingCredit: number };
  hasMismatch: boolean;
}

export default function BillingAuditPage() {
  const [searchType, setSearchType] = useState<"userId" | "callId">("userId");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);
    setCorrectionSuccess(null);

    try {
      const payload = searchType === "userId" 
        ? { userId: inputValue.trim() }
        : { callId: inputValue.trim() };
      
      const res = await api.post("/billing/audit", payload);
      setResults(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to run billing audit");
    } finally {
      setLoading(false);
    }
  };

  const applyCorrection = async () => {
    if (!selectedResult) return;
    setCorrecting(true);
    setCorrectionSuccess(null);
    setError(null);

    try {
      await api.post("/billing/correct", {
        sessionId: selectedResult.sessionId,
        applyDelta: true
      });
      setCorrectionSuccess("Correction applied successfully.");
      setSelectedResult(null);
      // Re-run audit to fetch updated data
      const payload = searchType === "userId" 
        ? { userId: inputValue.trim() }
        : { callId: inputValue.trim() };
      const res = await api.post("/billing/audit", payload);
      setResults(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to apply correction");
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-text tracking-tight">Billing Audit</h1>
        <p className="text-secondary mt-1 font-medium">Identify and correct billing discrepancies in settled calls</p>
      </div>

      {/* Input Form */}
      <div className="bg-cardSolid border border-border shadow-premium rounded-2xl p-6">
        <form onSubmit={handleAudit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-semibold text-secondary mb-2">Search By</label>
            <div className="flex bg-background border border-border rounded-xl p-1 w-fit">
              <button
                type="button"
                onClick={() => setSearchType("userId")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  searchType === "userId" ? "bg-primary text-white shadow-md" : "text-secondary hover:text-text"
                }`}
              >
                User ID (Student)
              </button>
              <button
                type="button"
                onClick={() => setSearchType("callId")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  searchType === "callId" ? "bg-primary text-white shadow-md" : "text-secondary hover:text-text"
                }`}
              >
                Call Session ID
              </button>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-semibold text-secondary mb-2">ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={searchType === "userId" ? "Enter Student User ID..." : "Enter Call Session ID..."}
                className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-text placeholder:text-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap h-[46px]"
          >
            {loading ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            {loading ? "Running Audit..." : "Run Audit"}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}
        {correctionSuccess && (
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-3 border border-green-100">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{correctionSuccess}</p>
          </div>
        )}
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : results !== null ? (
        results.length === 0 ? (
          <div className="bg-cardSolid border border-border shadow-premium rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-secondary">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No settled calls found</h3>
            <p className="text-secondary font-medium">Ensure you have the correct ID and the call is marked as settled.</p>
          </div>
        ) : (
          <div className="bg-cardSolid border border-border shadow-premium rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Session</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Duration (s)</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Stored Amt (₹)</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Expected Amt (₹)</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((res) => (
                    <tr key={res.sessionId} className={`transition-colors ${res.hasMismatch ? "bg-amber-50/30" : "hover:bg-black/5"}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text text-sm truncate max-w-[120px]" title={res.sessionId}>{res.sessionId}</div>
                        <div className="text-xs text-secondary mt-1">{new Date(res.settledAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-text">{res.durationSecs}</td>
                      <td className="px-6 py-4 text-right font-medium text-text">{res.stored.amountCharged}</td>
                      <td className="px-6 py-4 text-right font-medium text-text">{res.expected.amountCharged}</td>
                      <td className="px-6 py-4 text-center">
                        {res.hasMismatch ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Mismatch
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {res.hasMismatch && (
                          <button
                            onClick={() => setSelectedResult(res)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            Correct
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}

      {/* Correction Modal */}
      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResult(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-cardSolid border border-border shadow-2xl rounded-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-background">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">Apply Billing Correction</h2>
                    <p className="text-sm font-medium text-secondary truncate max-w-[250px]">{selectedResult.sessionId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Stored Amount</p>
                    <p className="text-2xl font-black text-text">₹{selectedResult.stored.amountCharged}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Expected Amount</p>
                    <p className="text-2xl font-black text-primary-dark">₹{selectedResult.expected.amountCharged}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-3">Wallet Deltas to Apply</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                      <span className="font-medium text-text">Student Wallet</span>
                      <span className={`font-bold ${selectedResult.delta.studentDebit > 0 ? "text-red-500" : selectedResult.delta.studentDebit < 0 ? "text-green-500" : "text-secondary"}`}>
                        {selectedResult.delta.studentDebit > 0 ? `Debit ₹${selectedResult.delta.studentDebit}` : selectedResult.delta.studentDebit < 0 ? `Credit ₹${Math.abs(selectedResult.delta.studentDebit)}` : "No Change"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                      <span className="font-medium text-text">Mentor Balance</span>
                      <span className={`font-bold ${selectedResult.delta.mentorCredit > 0 ? "text-green-500" : selectedResult.delta.mentorCredit < 0 ? "text-red-500" : "text-secondary"}`}>
                        {selectedResult.delta.mentorCredit > 0 ? `Credit ₹${selectedResult.delta.mentorCredit}` : selectedResult.delta.mentorCredit < 0 ? `Debit ₹${Math.abs(selectedResult.delta.mentorCredit)}` : "No Change"}
                      </span>
                    </div>
                    {selectedResult.delta.coachingCredit !== 0 && (
                      <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                        <span className="font-medium text-text">Coaching Center</span>
                        <span className={`font-bold ${selectedResult.delta.coachingCredit > 0 ? "text-green-500" : "text-red-500"}`}>
                          {selectedResult.delta.coachingCredit > 0 ? `Credit ₹${selectedResult.delta.coachingCredit}` : `Debit ₹${Math.abs(selectedResult.delta.coachingCredit)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-secondary bg-background p-4 rounded-xl border border-border">
                  Applying this correction will adjust the affected wallets atomically and update the CallSession record. This action cannot be undone automatically.
                </p>
              </div>

              <div className="p-6 border-t border-border bg-background flex justify-end gap-3">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-secondary hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCorrection}
                  disabled={correcting}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {correcting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {correcting ? "Applying..." : "Confirm & Apply"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
