import React from "react";
import { cn } from "@/lib/utils";

interface BadgePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "red" | "orange" | "green";
  label?: string;
  children?: React.ReactNode;
}

export default function BadgePill({
  variant = "primary",
  label,
  children,
  className,
  ...props
}: BadgePillProps) {
  const baseClasses =
    "inline-flex items-center px-2 py-0.5 text-3xs font-semibold tracking-wide uppercase rounded-full select-none";

  const variantClasses = {
    primary: "bg-teal-50 text-teal-700 border border-teal-200/50 dark:bg-teal-950/45 dark:text-teal-400 dark:border-teal-900/50",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200/50 dark:bg-slate-800/45 dark:text-slate-300 dark:border-slate-700/50",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/45 dark:text-emerald-400 dark:border-emerald-900/50",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/45 dark:text-amber-400 dark:border-amber-900/50",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-950/45 dark:text-rose-400 dark:border-rose-900/50",
    info: "bg-sky-50 text-sky-700 border border-sky-200/50 dark:bg-sky-950/45 dark:text-sky-400 dark:border-sky-900/50",
    red: "bg-red-50 text-red-700 border border-red-200/50 dark:bg-red-950/45 dark:text-red-400 dark:border-red-900/50",
    orange: "bg-orange-50 text-orange-700 border border-orange-200/50 dark:bg-orange-950/45 dark:text-orange-400 dark:border-orange-900/50",
    green: "bg-green-50 text-green-700 border border-green-200/50 dark:bg-green-950/45 dark:text-green-400 dark:border-green-900/50",
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {label || children}
    </span>
  );
}
