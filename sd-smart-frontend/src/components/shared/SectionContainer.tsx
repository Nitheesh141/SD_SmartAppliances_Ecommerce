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
    <section className={cn("py-6 md:py-14 overflow-hidden", bgClass)} {...props}>
      <div className={cn("max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12", className)}>
        {children}
      </div>
    </section>
  );
}
