import React from "react";
import { cn } from "@/lib/utils";

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  asLink?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export default function CTAButton({
  variant = "primary",
  size = "md",
  children,
  asLink = false,
  href = "#",
  target,
  rel,
  className,
  ...props
}: CTAButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer select-none active:scale-[0.98]";

  const variantClasses = {
    primary:
      "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg hover:shadow-teal-600/10 border border-teal-600 hover:border-teal-700",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg hover:shadow-slate-900/10 border border-slate-900",
    outline:
      "bg-transparent hover:bg-slate-50 text-slate-900 border border-slate-300 hover:border-slate-400 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-900",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const combinedClasses = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (asLink) {
    return (
      <a href={href} className={combinedClasses} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
