"use client";

import React, { useState } from "react";
import Workspace from "@/components/features/workspace/Workspace";
import PluginRequestBoard from "@/components/features/requests/PluginRequestBoard";
import AdminDashboard from "@/components/features/requests/AdminDashboard";
import PhoneLogin from "@/components/features/auth/PhoneLogin";
import { useAuth } from "@/components/providers/AuthProvider";
import { Hammer, MessageSquare, ShieldAlert, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ViewTab = "workspace" | "requests" | "admin";

export default function Home() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ViewTab>("workspace");
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-bg-surface-variant/40 p-1 rounded-pill">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`h-9 px-5 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-all duration-280 ${
                activeTab === "workspace"
                  ? "bg-bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Hammer className="w-3.5 h-3.5 stroke-[1.5px]" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`h-9 px-5 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-all duration-280 ${
                activeTab === "requests"
                  ? "bg-bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 stroke-[1.5px]" />
              <span>Plugin Board</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`h-9 px-5 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-all duration-280 ${
                activeTab === "admin"
                  ? "bg-bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 stroke-[1.5px]" />
              <span>Admin</span>
            </button>
          </nav>
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

      {/* Navigation Mobile Tabs */}
      <div className="md:hidden flex items-center justify-around bg-bg-surface border-b border-border-subtle/10 px-4 py-2 shrink-0">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === "workspace" ? "text-accent-blue" : "text-text-secondary"
          }`}
        >
          <Hammer className="w-5 h-5 stroke-[1.5px]" />
          <span>Workspace</span>
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === "requests" ? "text-accent-blue" : "text-text-secondary"
          }`}
        >
          <MessageSquare className="w-5 h-5 stroke-[1.5px]" />
          <span>Plugin Board</span>
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === "admin" ? "text-accent-blue" : "text-text-secondary"
          }`}
        >
          <ShieldAlert className="w-5 h-5 stroke-[1.5px]" />
          <span>Admin</span>
        </button>
      </div>

      {/* Page Content Viewport */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === "workspace" && <Workspace />}
        {activeTab === "requests" && <PluginRequestBoard />}
        {activeTab === "admin" && <AdminDashboard />}
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
