"use client";

import { useState } from "react";
import api from "@/lib/api";
import {
  Search, AlertTriangle, CheckCircle, RefreshCcw, X, Save,
  Globe, ShieldCheck, TrendingDown, Wallet, BadgeIndianRupee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/Skeleton";

interface AuditResult {
  sessionId: string;
  studentId: string;
  mentorId: string;
  durationSecs: number;
  settledAt: string;
  ratePerMin: number;
  stored: { amountCharged: number; mentorEarning: number; platformFee: number };
  expected: { amountCharged: number; mentorEarning: number; platformFee: number };
  delta: { studentDebit: number; mentorCredit: number; coachingCredit: number };
  hasMismatch: boolean;
}

interface GlobalSummary {
  totalScanned: number;
  totalSettled: number;
  mismatchCount: number;
  totalDeltaStudentDebit: number;
  totalDeltaMentorCredit: number;
  totalDeltaCoachingCredit: number;
}

export default function BillingAuditPage() {
  const [activeTab, setActiveTab] = useState<"targeted" | "global">("targeted");

  // Targeted audit state
  const [searchType, setSearchType] = useState<"userId" | "callId">("userId");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);

  // Global audit state
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalResults, setGlobalResults] = useState<AuditResult[] | null>(null);
  const [globalSummary, setGlobalSummary] = useState<GlobalSummary | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalLimit, setGlobalLimit] = useState("500");
  const [confirmCorrectAll, setConfirmCorrectAll] = useState(false);
  const [correctingAll, setCorrectingAll] = useState(false);
  const [correctAllResult, setCorrectAllResult] = useState<{ corrected: number; skipped: number; errors: any[] } | null>(null);

  // ── Targeted Audit ──────────────────────────────────────────────────────────
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
      await api.post("/billing/correct", { sessionId: selectedResult.sessionId, applyDelta: true });
      setCorrectionSuccess("Correction applied successfully.");
      setSelectedResult(null);
      const payload = searchType === "userId" ? { userId: inputValue.trim() } : { callId: inputValue.trim() };
      const res = await api.post("/billing/audit", payload);
      setResults(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to apply correction");
    } finally {
      setCorrecting(false);
    }
  };

  // ── Global Audit ────────────────────────────────────────────────────────────
  const handleGlobalAudit = async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    setGlobalResults(null);
    setGlobalSummary(null);
    setCorrectAllResult(null);
    try {
      const res = await api.post("/billing/audit-all", { limit: parseInt(globalLimit) || 500 });
      setGlobalResults(res.data.results);
      setGlobalSummary(res.data.summary);
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || "Failed to run global audit");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCorrectAll = async () => {
    if (!globalResults) return;
    const mismatchedIds = globalResults.filter((r) => r.hasMismatch).map((r) => r.sessionId);
    if (mismatchedIds.length === 0) return;

    setCorrectingAll(true);
    setCorrectAllResult(null);
    setGlobalError(null);
    try {
      const res = await api.post("/billing/correct-all", { sessionIds: mismatchedIds });
      setCorrectAllResult(res.data);
      setConfirmCorrectAll(false);
      // Refresh audit after correction
      await handleGlobalAudit();
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || "Failed to apply bulk correction");
    } finally {
      setCorrectingAll(false);
    }
  };

  const mismatchedSessions = globalResults?.filter((r) => r.hasMismatch) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-text tracking-tight">Billing Audit</h1>
        <p className="text-secondary mt-1 font-medium">Identify and correct billing discrepancies in settled calls</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-cardSolid border border-border rounded-2xl p-1 w-fit shadow-premium">
        <button
          onClick={() => setActiveTab("targeted")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "targeted" ? "bg-primary text-white shadow-md" : "text-secondary hover:text-text"
          }`}
        >
          <Search className="w-4 h-4" />
          Targeted Search
        </button>
        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "global" ? "bg-primary text-white shadow-md" : "text-secondary hover:text-text"
          }`}
        >
          <Globe className="w-4 h-4" />
          Global Audit
        </button>
      </div>

      {/* ── TARGETED AUDIT TAB ── */}
      {activeTab === "targeted" && (
        <>
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

          <AuditTable results={results} loading={loading} onCorrect={setSelectedResult} />
        </>
      )}

      {/* ── GLOBAL AUDIT TAB ── */}
      {activeTab === "global" && (
        <>
          <div className="bg-cardSolid border border-border shadow-premium rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Session Limit</label>
                <select
                  value={globalLimit}
                  onChange={(e) => setGlobalLimit(e.target.value)}
                  className="bg-background border border-border rounded-xl px-4 py-2.5 text-text font-medium focus:border-primary outline-none transition-all"
                >
                  <option value="100">Last 100</option>
                  <option value="500">Last 500</option>
                  <option value="1000">Last 1000</option>
                  <option value="2000">Last 2000</option>
                </select>
              </div>
              <button
                onClick={handleGlobalAudit}
                disabled={globalLoading}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 h-[46px]"
              >
                {globalLoading ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5" />}
                {globalLoading ? "Scanning..." : "Run Global Audit"}
              </button>

              {mismatchedSessions.length > 0 && (
                <button
                  onClick={() => setConfirmCorrectAll(true)}
                  disabled={correctingAll}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 h-[46px] ml-auto"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Correct All Mismatches ({mismatchedSessions.length})
                </button>
              )}
            </div>

            {globalError && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="font-medium text-sm">{globalError}</p>
              </div>
            )}
            {correctAllResult && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle className="w-5 h-5" />
                  Bulk correction complete
                </div>
                <p className="text-sm font-medium">
                  ✅ Corrected: <strong>{correctAllResult.corrected}</strong> &nbsp;·&nbsp;
                  ⏭ Skipped: <strong>{correctAllResult.skipped}</strong>
                  {correctAllResult.errors.length > 0 && (
                    <> &nbsp;·&nbsp; ❌ Errors: <strong className="text-red-600">{correctAllResult.errors.length}</strong></>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {globalSummary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <SummaryCard label="Total Settled" value={globalSummary.totalSettled} icon={<ShieldCheck className="w-5 h-5" />} color="blue" />
              <SummaryCard label="Scanned" value={globalSummary.totalScanned} icon={<Search className="w-5 h-5" />} color="indigo" />
              <SummaryCard label="Mismatches" value={globalSummary.mismatchCount} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
              <SummaryCard label="Student Δ (₹)" value={globalSummary.totalDeltaStudentDebit.toFixed(2)} icon={<Wallet className="w-5 h-5" />} color="red" />
              <SummaryCard label="Mentor Δ (₹)" value={globalSummary.totalDeltaMentorCredit.toFixed(2)} icon={<TrendingDown className="w-5 h-5" />} color="green" />
              <SummaryCard label="Coaching Δ (₹)" value={globalSummary.totalDeltaCoachingCredit.toFixed(2)} icon={<BadgeIndianRupee className="w-5 h-5" />} color="purple" />
            </div>
          )}

          {globalLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : globalResults && (
            <AuditTable results={globalResults} loading={false} onCorrect={setSelectedResult} />
          )}
        </>
      )}

      {/* ── Single Correction Modal ── */}
      <AnimatePresence>
        {selectedResult && (
          <CorrectionModal
            result={selectedResult}
            correcting={correcting}
            onClose={() => setSelectedResult(null)}
            onConfirm={applyCorrection}
          />
        )}
      </AnimatePresence>

      {/* ── Confirm Correct-All Modal ── */}
      <AnimatePresence>
        {confirmCorrectAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmCorrectAll(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-cardSolid border border-border shadow-2xl rounded-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-background flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Confirm Bulk Correction</h2>
                  <p className="text-sm text-secondary font-medium">This will apply {mismatchedSessions.length} corrections</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-secondary bg-background p-4 rounded-xl border border-border">
                  This will atomically correct all <strong className="text-text">{mismatchedSessions.length}</strong> mismatched sessions. Each correction runs in its own transaction. Any individual failure is logged and skipped. This action cannot be undone automatically.
                </p>
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3">
                <button onClick={() => setConfirmCorrectAll(false)} className="px-5 py-2.5 rounded-xl font-bold text-secondary hover:bg-black/5 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCorrectAll}
                  disabled={correctingAll}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {correctingAll ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {correctingAll ? "Applying..." : "Yes, Correct All"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared Table Component ──────────────────────────────────────────────────
function AuditTable({
  results,
  loading,
  onCorrect
}: {
  results: AuditResult[] | null;
  loading: boolean;
  onCorrect: (r: AuditResult) => void;
}) {
  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
  if (!results) return null;
  if (results.length === 0) return (
    <div className="bg-cardSolid border border-border shadow-premium rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-secondary">
        <Search className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-text mb-2">No settled calls found</h3>
      <p className="text-secondary font-medium">Ensure you have the correct ID and the call is marked as settled.</p>
    </div>
  );

  return (
    <div className="bg-cardSolid border border-border shadow-premium rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Session</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Duration (s)</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Rate (₹/min)</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Stored (₹)</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Expected (₹)</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Delta (₹)</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((res) => (
              <tr key={res.sessionId} className={`transition-colors ${res.hasMismatch ? "bg-amber-50/30" : "hover:bg-black/5"}`}>
                <td className="px-6 py-4">
                  <div className="font-medium text-text text-sm truncate max-w-[120px]" title={res.sessionId}>{res.sessionId}</div>
                  <div className="text-xs text-secondary mt-0.5">{new Date(res.settledAt).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-text">{res.durationSecs}</td>
                <td className="px-6 py-4 text-right font-medium text-text">₹{res.ratePerMin ?? '—'}</td>
                <td className="px-6 py-4 text-right font-medium text-text">{res.stored.amountCharged}</td>
                <td className="px-6 py-4 text-right font-medium text-text">{res.expected.amountCharged}</td>
                <td className={`px-6 py-4 text-right font-bold ${res.delta.studentDebit > 0 ? "text-red-500" : res.delta.studentDebit < 0 ? "text-green-500" : "text-secondary"}`}>
                  {res.delta.studentDebit !== 0 ? `${res.delta.studentDebit > 0 ? "+" : ""}${res.delta.studentDebit.toFixed(2)}` : "—"}
                </td>
                <td className="px-6 py-4 text-center">
                  {res.hasMismatch ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Mismatch
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> OK
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {res.hasMismatch && (
                    <button
                      onClick={() => onCorrect(res)}
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
  );
}

// ── Summary Stat Card ─────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, color }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "indigo" | "amber" | "red" | "green" | "purple";
}) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-600",
    green:  "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600"
  };
  return (
    <div className="bg-cardSolid border border-border shadow-premium rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-text">{value}</p>
        <p className="text-xs font-semibold text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Single-session Correction Modal ───────────────────────────────────────
function CorrectionModal({
  result,
  correcting,
  onClose,
  onConfirm
}: {
  result: AuditResult;
  correcting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
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
              <p className="text-sm font-medium text-secondary truncate max-w-[250px]">{result.sessionId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Stored Amount</p>
              <p className="text-2xl font-black text-text">₹{result.stored.amountCharged}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Expected Amount</p>
              <p className="text-2xl font-black text-primary-dark">₹{result.expected.amountCharged}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-3">Wallet Deltas to Apply</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                <span className="font-medium text-text">Student Wallet</span>
                <span className={`font-bold ${result.delta.studentDebit > 0 ? "text-red-500" : result.delta.studentDebit < 0 ? "text-green-500" : "text-secondary"}`}>
                  {result.delta.studentDebit > 0 ? `Debit ₹${result.delta.studentDebit}` : result.delta.studentDebit < 0 ? `Credit ₹${Math.abs(result.delta.studentDebit)}` : "No Change"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                <span className="font-medium text-text">Mentor Balance</span>
                <span className={`font-bold ${result.delta.mentorCredit > 0 ? "text-green-500" : result.delta.mentorCredit < 0 ? "text-red-500" : "text-secondary"}`}>
                  {result.delta.mentorCredit > 0 ? `Credit ₹${result.delta.mentorCredit}` : result.delta.mentorCredit < 0 ? `Debit ₹${Math.abs(result.delta.mentorCredit)}` : "No Change"}
                </span>
              </div>
              {result.delta.coachingCredit !== 0 && (
                <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                  <span className="font-medium text-text">Coaching Center</span>
                  <span className={`font-bold ${result.delta.coachingCredit > 0 ? "text-green-500" : "text-red-500"}`}>
                    {result.delta.coachingCredit > 0 ? `Credit ₹${result.delta.coachingCredit}` : `Debit ₹${Math.abs(result.delta.coachingCredit)}`}
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
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-secondary hover:bg-black/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={correcting}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {correcting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {correcting ? "Applying..." : "Confirm & Apply"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
