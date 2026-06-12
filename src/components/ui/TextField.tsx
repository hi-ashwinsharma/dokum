import React from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-text-secondary mb-1.5 pl-3">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-12 px-5 bg-bg-surface-variant text-text-primary placeholder:text-text-muted/50 border border-transparent rounded-pill focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-bg-surface transition-all duration-280",
            error && "ring-2 ring-red-500/50",
            className
          )}
          {...props}
        />
        {error && (
          <span className="block text-xs text-red-400 mt-1 pl-3">
            {error}
          </span>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
