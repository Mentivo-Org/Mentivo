"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    api.get("/auth/me")
      .then(() => router.replace("/dashboard"))
      .catch(() => { /* Not logged in, stay on login page */ });
  }, [router]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/request-otp", { email });
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-otp", { email, otp });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
             <img src="/logo.svg" alt="Mentivo Logo" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-text">Admin Login</h1>
          <p className="text-secondary text-sm">Strictly for mentivo personnel</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Work Email</label>
              <input
                type="email"
                placeholder="name@mentivo.in"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Request OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit code"
                required
                maxLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none tracking-widest text-center text-xl transition-all"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Login"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-secondary text-sm hover:underline"
            >
              Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
