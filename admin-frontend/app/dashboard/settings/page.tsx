"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [maxQuestionsPerPeriod, setMaxQuestionsPerPeriod] = useState<number>(5);
  const [periodHours, setPeriodHours] = useState<number>(24);
  const [maxQuestionChars, setMaxQuestionChars] = useState<string>("");
  const [maxAnswerChars, setMaxAnswerChars] = useState<string>("");
  
  // App Settings (Promotions & Announcements)
  const [promotionalText, setPromotionalText] = useState<string>("");
  const [announcement, setAnnouncement] = useState<string>("");

  // Mentor Level Prices & Discounts
  const [priceStandard, setPriceStandard] = useState<string>("");
  const [discountStandard, setDiscountStandard] = useState<string>("");
  const [priceVerified, setPriceVerified] = useState<string>("");
  const [discountVerified, setDiscountVerified] = useState<string>("");
  const [priceSignature, setPriceSignature] = useState<string>("");
  const [discountSignature, setDiscountSignature] = useState<string>("");
  const [priceFellow, setPriceFellow] = useState<string>("");
  const [discountFellow, setDiscountFellow] = useState<string>("");

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
      const [{ data: askData }, { data: settingsData }] = await Promise.all([
        api.get("/config/ask"),
        api.get("/config/settings")
      ]);

      // Set Q&A Limits
      setMaxQuestionsPerPeriod(askData.maxQuestionsPerPeriod);
      setPeriodHours(askData.periodHours);
      setMaxQuestionChars(askData.maxQuestionChars !== null ? askData.maxQuestionChars.toString() : "");
      setMaxAnswerChars(askData.maxAnswerChars !== null ? askData.maxAnswerChars.toString() : "");

      // Set App Settings
      setPromotionalText(settingsData.promotionalText || "");
      setAnnouncement(settingsData.announcement || "");

      // Set Mentor Pricing & Discounts
      setPriceStandard(settingsData.price_Standard || "");
      setDiscountStandard(settingsData.discount_Standard || "");
      setPriceVerified(settingsData.price_Verified || "");
      setDiscountVerified(settingsData.discount_Verified || "");
      setPriceSignature(settingsData.price_Signature || "");
      setDiscountSignature(settingsData.discount_Signature || "");
      setPriceFellow(settingsData.price_Fellow || "");
      setDiscountFellow(settingsData.discount_Fellow || "");
    } catch (err: any) {
      console.error("Failed to fetch settings config", err);
      setError("Failed to load settings configuration.");
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
      const parsedChars = maxQuestionChars.trim() === "" ? null : Number(maxQuestionChars);
      const parsedAnswerChars = maxAnswerChars.trim() === "" ? null : Number(maxAnswerChars);
      
      // Save Q&A and App Settings in parallel
      await Promise.all([
        api.post("/config/ask", {
          maxQuestionsPerPeriod: Number(maxQuestionsPerPeriod),
          periodHours: Number(periodHours),
          maxQuestionChars: parsedChars,
          maxAnswerChars: parsedAnswerChars,
        }),
        api.post("/config/settings/bulk", {
          settings: {
            promotionalText,
            announcement,
            price_Standard: priceStandard,
            discount_Standard: discountStandard,
            price_Verified: priceVerified,
            discount_Verified: discountVerified,
            price_Signature: priceSignature,
            discount_Signature: discountSignature,
            price_Fellow: priceFellow,
            discount_Fellow: discountFellow,
          }
        })
      ]);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save settings config", err);
      setError(err.response?.data?.error || "Failed to update settings configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">System Settings</h1>
          <p className="text-sm text-secondary mt-1">Configure limits, rate thresholds, and promotional/announcement banners for the app.</p>
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
          <p className="text-sm font-medium">Settings updated successfully!</p>
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-8 flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Q&A Settings Block */}
          <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-text border-b border-gray-100 pb-2">Q&A Settings</h2>
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
                  Max Question Character Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxQuestionChars}
                  onChange={(e) => setMaxQuestionChars(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                  placeholder="Leave blank for no character limit"
                />
                <p className="text-xs text-secondary mt-1.5">
                  Optional. If specified, posts exceeding this character limit will be blocked. Leave empty for unlimited character length.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Max Mentor Answer Character Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxAnswerChars}
                  onChange={(e) => setMaxAnswerChars(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                  placeholder="Leave blank for no answer character limit"
                />
                <p className="text-xs text-secondary mt-1.5">
                  Optional. If specified, mentor answers exceeding this character limit will be blocked. Leave empty for unlimited character length.
                </p>
              </div>
            </div>
          </div>

          {/* Mentor Pricing & Discounts Settings Block */}
          <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-text border-b border-gray-100 pb-2">Mentor Level Pricing & Discounts</h2>
            <div className="space-y-4">
              <p className="text-xs text-secondary mb-2">
                Configure original prices and optional discounted prices (INR per minute) for each level of mentors.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Standard */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <h3 className="font-semibold text-text text-sm">Standard Level</h3>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Original Price (₹/min)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceStandard}
                      onChange={(e) => setPriceStandard(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 7.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountStandard}
                      onChange={(e) => setDiscountStandard(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="Leave blank for no discount"
                    />
                  </div>
                </div>

                {/* Verified */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <h3 className="font-semibold text-text text-sm">Verified Level</h3>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Original Price (₹/min)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceVerified}
                      onChange={(e) => setPriceVerified(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 10.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountVerified}
                      onChange={(e) => setDiscountVerified(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="Leave blank for no discount"
                    />
                  </div>
                </div>

                {/* Signature */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <h3 className="font-semibold text-text text-sm">Signature Level</h3>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Original Price (₹/min)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceSignature}
                      onChange={(e) => setPriceSignature(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 15.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountSignature}
                      onChange={(e) => setDiscountSignature(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="Leave blank for no discount"
                    />
                  </div>
                </div>

                {/* Fellow */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <h3 className="font-semibold text-text text-sm">Fellow Level</h3>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Original Price (₹/min)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceFellow}
                      onChange={(e) => setPriceFellow(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 20.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountFellow}
                      onChange={(e) => setDiscountFellow(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="Leave blank for no discount"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotional Texts & Banners */}
          <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-text border-b border-gray-100 pb-2">In-App Banners & Promotions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Promotional Text
                </label>
                <textarea
                  rows={3}
                  value={promotionalText}
                  onChange={(e) => setPromotionalText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                  placeholder="Enter dynamic promotional text to show on student homepage (leave empty to hide)"
                />
                <p className="text-xs text-secondary mt-1.5">
                  Shown in the colored dynamic promotion banner at the top of the Student Homepage.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Announcement Text
                </label>
                <textarea
                  rows={3}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                  placeholder="Enter dynamic announcement/news to show on student homepage (leave empty to hide)"
                />
                <p className="text-xs text-secondary mt-1.5">
                  Shown in the dynamic announcement banner below the matchmaking banner on the Student Homepage.
                </p>
              </div>
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
