"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [maxQuestionsPerPeriod, setMaxQuestionsPerPeriod] = useState<number>(5);
  const [periodHours, setPeriodHours] = useState<number>(24);
  const [maxQuestionWords, setMaxQuestionWords] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/config/ask");
      setMaxQuestionsPerPeriod(data.maxQuestionsPerPeriod);
      setPeriodHours(data.periodHours);
      setMaxQuestionWords(data.maxQuestionWords !== null ? data.maxQuestionWords.toString() : "");
    } catch (err: any) {
      console.error("Failed to fetch config", err);
      setError("Failed to load Q&A settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const parsedWords = maxQuestionWords.trim() === "" ? null : Number(maxQuestionWords);
      await api.post("/config/ask", {
        maxQuestionsPerPeriod: Number(maxQuestionsPerPeriod),
        periodHours: Number(periodHours),
        maxQuestionWords: parsedWords,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save config", err);
      setError(err.response?.data?.error || "Failed to update Q&A settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Q&A Settings</h1>
          <p className="text-sm text-secondary mt-1">Configure limits and rate thresholds for the student Q&A Ask page.</p>
        </div>
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="p-2 text-secondary hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh Settings"
        >
          <RefreshCw size={20} className={loading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 flex items-center gap-3">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">Q&A configuration settings updated successfully!</p>
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-8 flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-card rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Rate Limit - Max Questions
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxQuestionsPerPeriod}
                onChange={(e) => setMaxQuestionsPerPeriod(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                placeholder="e.g. 5"
              />
              <p className="text-xs text-secondary mt-1.5">
                The maximum number of questions a student can ask within the rate limit window.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Rate Limit - Period Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                required
                value={periodHours}
                onChange={(e) => setPeriodHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                placeholder="e.g. 24"
              />
              <p className="text-xs text-secondary mt-1.5">
                The rolling window time duration in hours. (For example, 24 hours means the limit resets gradually over a day).
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Max Question Word Count
              </label>
              <input
                type="number"
                min="1"
                value={maxQuestionWords}
                onChange={(e) => setMaxQuestionWords(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                placeholder="Leave blank for no word limit"
              />
              <p className="text-xs text-secondary mt-1.5">
                Optional. If specified, posts exceeding this word limit will be blocked. Leave empty for unlimited word length.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-md shadow-primary/10 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
