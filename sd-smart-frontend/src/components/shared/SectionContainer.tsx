import React from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  bgClass?: string;
}

export default function SectionContainer({
  children,
  className,
  bgClass,
  ...props
}: SectionContainerProps) {
  return (
    <section className={cn("py-16 md:py-24 overflow-hidden", bgClass)} {...props}>
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
        {children}
      </div>
    </section>
  );
}
