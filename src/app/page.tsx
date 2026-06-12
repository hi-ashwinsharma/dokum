"use client";

import React, { useState, useEffect, useMemo } from "react";
import Workspace from "@/components/features/workspace/Workspace";
import PhoneLogin from "@/components/features/auth/PhoneLogin";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  LogIn, 
  LogOut, 
  Search, 
  Scissors, 
  Hash, 
  RotateCw, 
  FileText 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTool, setActiveTool] = useState<"merge" | "rotate" | "split" | "numbers">("merge");
  
  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Auto reset selection index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [commandSearch]);

  // Keyboard shortcut listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toolsList = useMemo(() => [
    { id: "merge", label: "Merge PDFs", desc: "Combine multiple PDF files or sections", shortcut: "M" },
    { id: "rotate", label: "Rotate PDF Pages", desc: "Rotate pages clockwise by 90, 180, 270 degrees", shortcut: "R" },
    { id: "split", label: "Extract Pages (Split)", desc: "Save custom page range as a new PDF", shortcut: "E" },
    { id: "numbers", label: "Add Page Numbers", desc: "Insert page number stamps in the footer", shortcut: "N" }
  ], []);

  const filteredTools = useMemo(() => {
    if (!commandSearch) return toolsList;
    return toolsList.filter(t => 
      t.label.toLowerCase().includes(commandSearch.toLowerCase()) || 
      t.desc.toLowerCase().includes(commandSearch.toLowerCase())
    );
  }, [commandSearch, toolsList]);

  return (
    <div className="h-screen flex flex-col bg-bg-main text-text-primary overflow-hidden">
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

        {/* Middle Section: Pinned Tools & Search Bar */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="h-8 px-3 bg-bg-surface-variant hover:bg-bg-surface-variant/80 text-text-secondary border border-border-subtle/10 rounded-pill flex items-center gap-2 text-xs transition-all duration-280 cursor-pointer min-w-[170px]"
          >
            <Search className="w-3.5 h-3.5 stroke-[1.5px] text-text-muted" />
            <span>Search tools...</span>
            <span className="ml-auto text-[9px] font-mono text-text-muted bg-bg-surface px-1.5 py-0.5 rounded border border-border-subtle/10">⌘K</span>
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-border-subtle/30" />

          <div className="flex items-center gap-1 bg-bg-surface-variant/60 p-0.5 rounded-pill border border-border-subtle/10">
            {(
              [
                { id: "merge", label: "Merge", icon: FileText, desc: "Combine PDFs" },
                { id: "rotate", label: "Rotate", icon: RotateCw, desc: "Rotate PDF" },
                { id: "split", label: "Extract", icon: Scissors, desc: "Split pages" },
                { id: "numbers", label: "Numbers", icon: Hash, desc: "Page numbers" },
              ] as const
            ).map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <div key={tool.id} className="relative group">
                  <button
                    onClick={() => setActiveTool(tool.id)}
                    className={`h-7 rounded-pill flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTool === tool.id
                        ? "bg-bg-surface text-accent-blue shadow-sm px-3 text-[11px] font-bold"
                        : "text-text-secondary hover:text-text-primary px-2"
                    }`}
                  >
                    <ToolIcon className="w-3.5 h-3.5 stroke-[1.5px]" />
                    {activeTool === tool.id && <span>{tool.label}</span>}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 bg-text-primary text-bg-surface text-[10px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap">
                    {tool.desc}
                  </div>
                </div>
              );
            })}
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
      <main className="flex-1 overflow-hidden min-h-0">
        <Workspace activeTool={activeTool} setActiveTool={setActiveTool} />
      </main>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh] p-4"
          onClick={() => setShowCommandPalette(false)}
        >
          <div 
            className="w-full max-w-lg bg-bg-surface border border-border-subtle/10 rounded-container shadow-soft_elevation overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border-subtle/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Type a tool name or command..."
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.min(filteredTools.length - 1, prev + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(0, prev - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredTools[selectedIndex]) {
                      setActiveTool(filteredTools[selectedIndex].id as any);
                      setShowCommandPalette(false);
                      setCommandSearch("");
                    }
                  }
                }}
                className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none placeholder:text-text-muted font-sans"
                autoFocus
              />
              <button 
                onClick={() => setShowCommandPalette(false)}
                className="text-[10px] text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded border border-border-subtle/20 font-mono"
              >
                ESC
              </button>
            </div>
            
            <div className="max-h-[280px] overflow-y-auto p-2">
              {filteredTools.map((t, index) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id as any);
                    setShowCommandPalette(false);
                    setCommandSearch("");
                  }}
                  className={`w-full flex items-center justify-between text-left p-3 rounded-interactive transition-all group ${
                    index === selectedIndex
                      ? "bg-bg-surface-variant/90 border-l-2 border-accent-blue pl-2.5 text-accent-blue"
                      : "hover:bg-bg-surface-variant/50 text-text-primary"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{t.desc}</div>
                  </div>
                  <kbd className="text-[9px] font-mono text-text-muted bg-bg-surface-variant/60 group-hover:bg-bg-surface px-1.5 py-0.5 rounded border border-border-subtle/10">
                    {t.shortcut}
                  </kbd>
                </button>
              ))}
              {filteredTools.length === 0 && (
                <div className="p-4 text-center text-xs text-text-muted">
                  No tools found matching search query
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
