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
  const [freeCallDurationMins, setFreeCallDurationMins] = useState<number>(5);

  // Mentor Level Prices & Discounts
  const [priceStandard, setPriceStandard] = useState<string>("");
  const [discountStandard, setDiscountStandard] = useState<string>("");
  const [priceVerified, setPriceVerified] = useState<string>("");
  const [discountVerified, setDiscountVerified] = useState<string>("");
  const [priceSignature, setPriceSignature] = useState<string>("");
  const [discountSignature, setDiscountSignature] = useState<string>("");
  const [priceFellow, setPriceFellow] = useState<string>("");
  const [discountFellow, setDiscountFellow] = useState<string>("");

  const [topMentorsMinRating, setTopMentorsMinRating] = useState<string>("4.5");
  const [topMentorsMinCalls, setTopMentorsMinCalls] = useState<string>("10");
  const [topMentorsLimit, setTopMentorsLimit] = useState<string>("5");
  const [previewMentors, setPreviewMentors] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
      setFreeCallDurationMins(Number(settingsData.free_call_duration_mins || 5));

      // Set Mentor Pricing & Discounts
      setPriceStandard(settingsData.price_Standard || "");
      setDiscountStandard(settingsData.discount_Standard || "");
      setPriceVerified(settingsData.price_Verified || "");
      setDiscountVerified(settingsData.discount_Verified || "");
      setPriceSignature(settingsData.price_Signature || "");
      setDiscountSignature(settingsData.discount_Signature || "");
      setPriceFellow(settingsData.price_Fellow || "");
      setDiscountFellow(settingsData.discount_Fellow || "");
      setTopMentorsMinRating(settingsData.top_mentors_min_rating || "4.5");
      setTopMentorsMinCalls(settingsData.top_mentors_min_calls || "10");
      setTopMentorsLimit(settingsData.top_mentors_limit || "5");
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
            free_call_duration_mins: freeCallDurationMins.toString(),
            top_mentors_min_rating: topMentorsMinRating,
            top_mentors_min_calls: topMentorsMinCalls,
            top_mentors_limit: topMentorsLimit,
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

  const handlePreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewMentors([]);
    try {
      const { data } = await api.post("/mentors/top-mentors/preview", {
        minRating: topMentorsMinRating,
        minCalls: topMentorsMinCalls,
        limit: topMentorsLimit,
      });
      setPreviewMentors(data);
      if (data.length === 0) {
        setPreviewError("No mentors match these criteria.");
      }
    } catch (err: any) {
      console.error("Failed to preview top mentors", err);
      setPreviewError(err.response?.data?.error || "Failed to load preview.");
    } finally {
      setPreviewLoading(false);
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
                      type="text"
                      value={priceStandard}
                      onChange={(e) => setPriceStandard(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 7.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="text"
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
                      type="text"
                      value={priceVerified}
                      onChange={(e) => setPriceVerified(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 10.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="text"
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
                      type="text"
                      value={priceSignature}
                      onChange={(e) => setPriceSignature(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 15.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="text"
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
                      type="text"
                      value={priceFellow}
                      onChange={(e) => setPriceFellow(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text bg-white"
                      placeholder="e.g. 20.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Discounted Price (₹/min) - Optional</label>
                    <input
                      type="text"
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

          {/* Call Settings */}
          <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-text border-b border-gray-100 pb-2">Call Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  First-Call Free Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={freeCallDurationMins}
                  onChange={(e) => setFreeCallDurationMins(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                  placeholder="e.g. 5"
                />
                <p className="text-xs text-secondary mt-1.5">
                  The duration in minutes for the first free call offered to students.
                </p>
              </div>
            </div>
          </div>

          {/* Top Mentors Settings */}
          <div className="bg-card rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-text border-b border-gray-100 pb-2">Top Mentors Selection</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Min Average Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    required
                    value={topMentorsMinRating}
                    onChange={(e) => setTopMentorsMinRating(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                    placeholder="e.g. 4.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Min Total Calls
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={topMentorsMinCalls}
                    onChange={(e) => setTopMentorsMinCalls(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                    placeholder="e.g. 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Display Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={topMentorsLimit}
                    onChange={(e) => setTopMentorsLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text bg-white"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text font-medium rounded-lg disabled:opacity-50 transition-all border border-gray-300 text-sm"
                >
                  {previewLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      Loading Preview...
                    </>
                  ) : (
                    "Preview Top Mentors"
                  )}
                </button>
              </div>

              {previewError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                  {previewError}
                </div>
              )}

              {previewMentors.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider grid grid-cols-4">
                    <span className="col-span-2">Mentor</span>
                    <span>Rating</span>
                    <span>Calls</span>
                  </div>
                  <div className="divide-y divide-gray-150 max-h-60 overflow-y-auto">
                    {previewMentors.map((mentor) => (
                      <div key={mentor.mentorId} className="px-4 py-3 grid grid-cols-4 items-center text-sm">
                        <div className="col-span-2 flex items-center gap-3">
                          {mentor.user?.photo_url ? (
                            <img
                              src={mentor.user.photo_url}
                              alt={mentor.user.name || "Mentor"}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-200">
                              {(mentor.user?.name || "M").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-text">{mentor.user?.name || "Anonymous"}</p>
                            <p className="text-xs text-secondary">{mentor.iit_name || "N/A"}</p>
                          </div>
                        </div>
                        <div className="text-text font-medium flex items-center gap-1">
                          {Number(mentor.avg_rating).toFixed(1)} ⭐
                        </div>
                        <div className="text-secondary">{mentor.total_calls} calls</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
