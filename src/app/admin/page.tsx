"use client";

import React from "react";
import AdminDashboard from "@/components/features/requests/AdminDashboard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-40 bg-bg-main/80 backdrop-blur-md border-b border-border-subtle/10 px-6 h-16 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors font-semibold bg-bg-surface-variant/55 px-3.5 py-2 rounded-pill"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>
          <span className="text-sm font-bold text-text-primary pl-2">
            Dokum Administration
          </span>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1 p-6">
        <AdminDashboard />
      </main>
    </div>
  );
}
