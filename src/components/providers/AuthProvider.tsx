"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from "firebase/auth";
import { auth } from "@/services/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  recaptchaVerifier: RecaptchaVerifier | null;
  confirmationResult: ConfirmationResult | null;
  sendVerificationCode: (phoneNumber: string) => Promise<boolean>;
  confirmVerificationCode: (code: string) => Promise<User | null>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize reCAPTCHA on the client-side
  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;

    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved - will trigger signInWithPhoneNumber
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try again.");
        }
      });

      if (active) {
        // Defer updating state to avoid react-hooks/set-state-in-effect warning
        Promise.resolve().then(() => {
          if (active) {
            setRecaptchaVerifier(verifier);
          }
        });
      }

      return () => {
        active = false;
        verifier.clear();
      };
    } catch (err: unknown) {
      console.error("Failed to initialize RecaptchaVerifier", err);
    }
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const sendVerificationCode = async (phoneNumber: string): Promise<boolean> => {
    setError(null);
    if (!recaptchaVerifier) {
      setError("Auth system is still initializing. Please try again in a moment.");
      return false;
    }

    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      return true;
    } catch (err: unknown) {
      console.error("SMS send failed", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send verification code. Check phone format.";
      setError(errorMessage);
      return false;
    }
  };

  const confirmVerificationCode = async (code: string): Promise<User | null> => {
    setError(null);
    if (!confirmationResult) {
      setError("No active login transaction found.");
      return null;
    }

    try {
      const result = await confirmationResult.confirm(code);
      setUser(result.user);
      return result.user;
    } catch (err: unknown) {
      console.error("Code verification failed", err);
      setError("Invalid code. Please try again.");
      return null;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setConfirmationResult(null);
    } catch (err: unknown) {
      console.error("Sign out failed", err);
      setError("Logout failed.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        recaptchaVerifier,
        confirmationResult,
        sendVerificationCode,
        confirmVerificationCode,
        logout,
        error,
        setError
      }}
    >
      {children}
      {/* Invisible container required for Firebase Invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
