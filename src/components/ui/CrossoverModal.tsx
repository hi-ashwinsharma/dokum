"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "./Button";

interface CrossoverModalProps {
  isOpen: boolean;
  message: string;
  onProceed: () => void;
  onCancel: () => void;
}

export function CrossoverModal({
  isOpen,
  message,
  onProceed,
  onCancel,
}: CrossoverModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/95 backdrop-blur-md px-6"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg bg-bg-surface border border-border-subtle/15 p-8 rounded-container shadow-2xl relative overflow-hidden"
          >
            {/* Design accents */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Close icon */}
            <button
              onClick={onCancel}
              className="absolute top-5 right-5 p-1.5 rounded-interactive text-text-muted hover:text-text-primary hover:bg-bg-surface-variant/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sparkles Icon */}
            <div className="w-12 h-12 rounded-component bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-6">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            {/* Title / Message */}
            <h3 className="text-xl font-bold text-text-primary mb-3 leading-snug">
              Multiple Actions Detected
            </h3>
            <p className="text-sm text-text-secondary mb-8 leading-relaxed">
              To {message.toLowerCase()}, let's head over to the unified studio workspace where you can run all steps concurrently.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-pill text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onProceed}
                className="px-6 py-2.5 rounded-pill text-xs font-semibold flex items-center gap-2 group bg-accent-blue text-white hover:bg-accent-blue-hover transition-colors"
              >
                <span>Proceed to PDF Studio</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
