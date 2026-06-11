import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badge?: string;
  align?: "left" | "center" | "right";
}

export default function SectionHeader({
  title,
  subtitle,
  badge,
  align = "center",
  className,
  ...props
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div
      className={cn(
        "flex flex-col mb-12 md:mb-16 max-w-3xl mx-auto",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {badge && (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-teal-800 bg-teal-100/80 rounded-full mb-3 uppercase dark:bg-teal-950 dark:text-teal-300">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 leading-tight tracking-tight dark:text-slate-100">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-slate-600 font-sans leading-relaxed dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
