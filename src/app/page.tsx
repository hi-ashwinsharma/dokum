"use client";

import React, { useState } from "react";
import Workspace from "@/components/features/workspace/Workspace";
import PhoneLogin from "@/components/features/auth/PhoneLogin";
import { useAuth } from "@/components/providers/AuthProvider";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-bg-main/80 backdrop-blur-md border-b border-border-subtle/10 px-6 h-16 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-pill bg-gradient-to-r from-accent-blue to-[#4285f4] flex items-center justify-center text-white shadow-sm font-semibold text-sm">
              D
            </div>
            <span className="text-lg font-bold tracking-tight text-text-primary font-sans">
              Dokum
            </span>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-text-secondary font-mono bg-bg-surface-variant/80 px-3 py-1.5 rounded-pill">
                {user.phoneNumber}
              </span>
              <button
                onClick={logout}
                className="h-10 px-4 rounded-pill border border-border-subtle bg-bg-surface hover:bg-bg-surface-variant text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-all duration-280"
              >
                <LogOut className="w-4 h-4 stroke-[1.5px]" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowAuthModal(true)}
              className="h-10 text-xs px-4 flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 stroke-[1.5px]" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </header>

      {/* Page Content Viewport */}
      <main className="flex-1 overflow-x-hidden">
        <Workspace />
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-bg-surface rounded-container p-1 border border-border-subtle/10">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-10 p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-surface-variant"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pt-8">
              <PhoneLogin onSuccess={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Close Icon
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
