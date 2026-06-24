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
    "inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full select-none shadow-sm";

  const variantClasses = {
    primary: "bg-[#D71920] text-white dark:bg-[#D71920]",
    secondary: "bg-slate-600 text-white dark:bg-neutral-800",
    success: "bg-emerald-600 text-white dark:bg-emerald-600",
    warning: "bg-amber-500 text-white dark:bg-amber-600",
    danger: "bg-rose-600 text-white dark:bg-rose-600",
    info: "bg-sky-600 text-white dark:bg-sky-600",
    red: "bg-[#D71920] text-white dark:bg-[#D71920]",
    orange: "bg-orange-600 text-white dark:bg-orange-600",
    green: "bg-green-600 text-white dark:bg-green-600",
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {label || children}
    </span>
  );
}
