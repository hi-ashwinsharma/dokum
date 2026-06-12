"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Phone, Lock, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

interface PhoneLoginProps {
  onSuccess?: () => void;
}

export default function PhoneLogin({ onSuccess }: PhoneLoginProps) {
  const { sendVerificationCode, confirmVerificationCode, error, setError } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);

    // Format phone number to E.164 if not already done
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      // Default to India +91 if code is missing, otherwise user can write +xx
      if (formattedPhone.length === 10) {
        formattedPhone = "+91" + formattedPhone;
      } else {
        setError("Please enter phone number with country code (e.g. +91XXXXXXXXXX)");
        setLoading(false);
        return;
      }
    }

    const success = await sendVerificationCode(formattedPhone);
    setLoading(false);
    if (success) {
      setStep("code");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    setLoading(true);
    setError(null);

    const user = await confirmVerificationCode(verificationCode.trim());
    setLoading(false);
    if (user) {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-container bg-bg-surface shadow-soft_elevation border border-border-subtle/20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {step === "phone" ? "Enter your phone number" : "Verify code"}
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          {step === "phone" 
            ? "We will send you a one-time SMS verification code." 
            : `We sent a code to ${phoneNumber}. Enter it below.`}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 text-sm rounded-interactive bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendCode} className="space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
              <Phone className="w-5 h-5 stroke-[1.5px]" />
            </span>
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-bg-surface-variant text-text-primary placeholder:text-text-muted/60 border border-transparent rounded-pill focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-bg-surface transition-all duration-280"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full h-14 bg-gradient-to-r from-accent-blue to-accent-blue-hover text-white rounded-pill font-medium flex items-center justify-center gap-2 hover:opacity-95 transition-all duration-280 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Send Code</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
              <Lock className="w-5 h-5 stroke-[1.5px]" />
            </span>
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              className="w-full h-14 pl-12 pr-4 bg-bg-surface-variant text-text-primary placeholder:text-text-muted/60 border border-transparent rounded-pill focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-bg-surface text-center tracking-[0.2em] font-mono text-lg transition-all duration-280"
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
              disabled={loading}
              className="flex-1 h-14 border border-border-subtle bg-transparent text-text-primary hover:bg-bg-surface-variant rounded-pill font-medium transition-all duration-280 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="flex-1 h-14 bg-gradient-to-r from-accent-blue to-accent-blue-hover text-white rounded-pill font-medium flex items-center justify-center gap-2 hover:opacity-95 transition-all duration-280 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>Verify</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
