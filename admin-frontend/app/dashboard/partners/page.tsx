"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { UserPlus, Settings, Loader2, Sparkles, Mail, Phone, Users, ShieldAlert, Award } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface Partner {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  referralCode: string | null;
  commissionMethod: string | null;
  studentBonusValue: number | null;
  commissionValue: any | null;
  createdBy: string | null;
  created_at: string;
  coachingCenter?: {
    id: string;
    name: string;
  } | null;
  partnerBalance?: {
    pendingPayout: string;
    totalEarned: string;
  } | null;
}

interface CoachingCenter {
  id: string;
  name: string;
  code: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Partner Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "other_partner",
    referralCode: "",
    commissionMethod: "per_signup",
    commissionValue: "50",
    studentBonusValue: "0",
    coachingCenterId: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Commission Modal State
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [commissionForm, setCommissionForm] = useState({
    commissionMethod: "per_signup",
    commissionValue: "50",
    studentBonusValue: "0",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/partners/list");
      setPartners(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load partners.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachingCenters = async () => {
    try {
      const { data } = await api.get("/partners/coaching-centers");
      setCoachingCenters(data);
    } catch (err) {
      console.error("Failed to load coaching centers:", err);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchCoachingCenters();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      await api.post("/partners/create", {
        ...createForm,
        commissionValue: Number(createForm.commissionValue) || 0,
        studentBonusValue: Number(createForm.studentBonusValue) || 0,
        coachingCenterId: createForm.role === "coaching_partner" ? createForm.coachingCenterId : undefined,
      });

      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        role: "other_partner",
        referralCode: "",
        commissionMethod: "per_signup",
        commissionValue: "50",
        studentBonusValue: "0",
        coachingCenterId: "",
      });
      fetchPartners();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || "Failed to create partner account.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setEditLoading(true);
    setEditError("");

    try {
      await api.put(`/partners/${editingPartner.id}/commission`, {
        commissionMethod: commissionForm.commissionMethod,
        commissionValue: Number(commissionForm.commissionValue) || 0,
        studentBonusValue: Number(commissionForm.studentBonusValue) || 0,
      });

      setEditingPartner(null);
      fetchPartners();
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to update commission settings.");
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setCommissionForm({
      commissionMethod: partner.commissionMethod || "per_signup",
      commissionValue: partner.commissionValue?.toString() || "0",
      studentBonusValue: partner.studentBonusValue?.toString() || "0",
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 text-gray-900 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="text-blue-600" />
            Partner Referrals
          </h1>
          <p className="text-gray-500 mt-1">Manage marketing partners, coaching centers, and telegram admin accounts.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <UserPlus size={20} />
          Create Partner invite
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Partners List */}
      <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Partner details</th>
                <th className="px-6 py-4">Type / Referral</th>
                <th className="px-6 py-4">Commission Model</th>
                <th className="px-6 py-4">Earnings / Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48 mt-1" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-5 w-24 mb-1.5" />
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Skeleton className="h-8 w-8 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-500">
                    <Users className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="font-semibold text-lg">No partners found</p>
                    <p className="text-sm text-gray-400 mt-1">Register partner accounts to generate invitation links.</p>
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 text-base">{partner.name || "Unnamed Partner"}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1"><Mail size={14} /> {partner.email}</span>
                        {partner.phone && <span className="flex items-center gap-1"><Phone size={14} /> {partner.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-1.5 ${
                        partner.role === 'coaching_partner' ? 'bg-indigo-50 text-indigo-700' :
                        partner.role === 'telegram_partner' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {partner.role.replace('_', ' ')}
                      </span>
                      <div className="font-mono text-sm font-semibold text-blue-600 bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded-md w-fit">
                        {partner.referralCode}
                      </div>
                      {partner.coachingCenter && (
                        <div className="text-xs text-indigo-600 font-bold mt-1">
                          Center: {partner.coachingCenter.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-gray-800 text-sm">
                        {partner.commissionMethod === 'per_signup' ? 'Flat rate per signup' : 'Percent of revenue'}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Value: {partner.commissionMethod === 'per_signup' ? `₹${partner.commissionValue}` : `${partner.commissionValue}%`}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm">
                        <span className="text-gray-500">Earned:</span>{' '}
                        <span className="font-bold text-gray-800">₹{partner.partnerBalance?.totalEarned || '0.00'}</span>
                      </div>
                      <div className="text-xs text-amber-600 font-semibold mt-0.5">
                        Pending: ₹{partner.partnerBalance?.pendingPayout || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => openEditModal(partner)}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-blue-600 transition-all border border-transparent hover:border-gray-200"
                        title="Configure commission settings"
                      >
                        <Settings size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-[28px] max-w-lg w-full p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-2">
              <UserPlus className="text-blue-600" />
              Invite Partner
            </h2>
            <p className="text-sm text-gray-500 mb-6">Create the partner profile. An invitation setup email will be dispatched immediately.</p>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Rohit Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="rohit@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Partner Type</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="other_partner">Other Social Partner</option>
                    <option value="telegram_partner">Telegram Admin</option>
                    <option value="coaching_partner">Coaching Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Referral Code</label>
                  <input
                    type="text"
                    required
                    value={createForm.referralCode}
                    onChange={(e) => setCreateForm({ ...createForm, referralCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
                    placeholder="e.g. amitjee"
                  />
                </div>
              </div>

              {createForm.role === "coaching_partner" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Link Coaching Center</label>
                  <select
                    required
                    value={createForm.coachingCenterId}
                    onChange={(e) => setCreateForm({ ...createForm, coachingCenterId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="">-- Choose coaching center --</option>
                    {coachingCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-150 p-4 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Commission Method</label>
                  <select
                    value={createForm.commissionMethod}
                    onChange={(e) => setCreateForm({ ...createForm, commissionMethod: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="per_signup">Flat Per Signup (₹)</option>
                    <option value="percent_revenue">Revenue Share (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Commission Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={createForm.commissionValue}
                    onChange={(e) => setCreateForm({ ...createForm, commissionValue: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 mt-4">Student Bonus Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={createForm.studentBonusValue}
                  onChange={(e) => setCreateForm({ ...createForm, studentBonusValue: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="e.g. 20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {createLoading ? <Loader2 size={18} className="animate-spin" /> : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {editingPartner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-[28px] max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-2">
              <Award className="text-blue-600" />
              Configure Commission
            </h2>
            <p className="text-sm text-gray-500 mb-6">Modify the payout settings for <strong>{editingPartner.name}</strong>.</p>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium mb-4">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Commission Method</label>
                <select
                  value={commissionForm.commissionMethod}
                  onChange={(e) => setCommissionForm({ ...commissionForm, commissionMethod: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="per_signup">Flat Per Signup (₹)</option>
                  <option value="percent_revenue">Revenue Share (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Commission Value</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={commissionForm.commissionValue}
                  onChange={(e) => setCommissionForm({ ...commissionForm, commissionValue: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 mt-4">Student Bonus Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={commissionForm.studentBonusValue}
                  onChange={(e) => setCommissionForm({ ...commissionForm, studentBonusValue: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="e.g. 20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {editLoading ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
