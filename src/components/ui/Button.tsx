import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-pill transition-all duration-280 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-gradient-to-r from-accent-blue to-accent-blue-hover text-white shadow-sm hover:opacity-95": 
              variant === "primary",
            "bg-bg-surface-variant hover:bg-bg-surface-variant/80 text-text-primary": 
              variant === "secondary",
            "bg-transparent hover:bg-bg-surface-variant/50 text-text-secondary hover:text-text-primary": 
              variant === "ghost",
            "bg-red-500 hover:bg-red-600 text-white shadow-sm": 
              variant === "danger"
          },
          {
            "h-9 px-4 text-sm": size === "sm",
            "h-12 px-6 text-sm": size === "md",
            "h-14 px-8 text-base": size === "lg"
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
