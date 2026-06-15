"use client";

import React, { useState } from "react";
import { Sparkles, CornerDownLeft, Loader2 } from "lucide-react";
import { commandModel } from "@/services/firebase/ai";

interface SourceFile {
  id: string;
  file: File;
  pageCount: number;
}

interface NLPCommandBarProps {
  files: SourceFile[];
  activeTool: "merge" | "rotate" | "split" | "numbers";
  onCommandResponse: (response: any) => void;
}

export default function NLPCommandBar({
  files,
  activeTool,
  onCommandResponse,
}: NLPCommandBarProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      // Map current workspace files context
      const filesContext = files.map((f) => ({
        name: f.file.name,
        pageCount: f.pageCount,
      }));

      const contextPayload = {
        prompt: prompt.trim(),
        activeTool,
        files: filesContext,
      };

      // Call Firebase AI Logic
      const result = await commandModel.generateContent(
        JSON.stringify(contextPayload)
      );
      const rawText = result.response.text();
      
      const jsonResponse = JSON.parse(rawText);
      onCommandResponse(jsonResponse);
      setPrompt("");
    } catch (err) {
      console.error("Failed executing NLP command:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full shrink-0 z-20">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-bg-surface/60 backdrop-blur-lg border border-border-subtle/10 rounded-pill px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-border-subtle/20 focus-within:border-accent-blue/30 transition-all duration-300"
      >
        {/* Glow behind input */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-blue/5 to-transparent rounded-pill blur-md opacity-0 focus-within:opacity-100 transition-opacity" />

        {/* AI Icon */}
        <div className="flex items-center gap-2 shrink-0 mr-3 text-text-secondary">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
          ) : (
            <Sparkles className="w-4 h-4 text-accent-blue animate-pulse" />
          )}
        </div>

        {/* Input field */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          placeholder={
            loading
              ? "Dokum AI is reasoning..."
              : `Ask Dokum to configure the ${activeTool} workspace (e.g. "rotate the second page")`
          }
          className="flex-1 bg-transparent border-0 outline-0 ring-0 text-sm placeholder:text-text-muted text-text-primary h-7 pr-4"
        />

        {/* Action hint button */}
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="p-2 rounded-interactive bg-bg-surface-variant/40 hover:bg-bg-surface-variant/80 disabled:opacity-45 text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
