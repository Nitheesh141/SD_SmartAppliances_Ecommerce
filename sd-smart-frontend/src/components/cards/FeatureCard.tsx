import React from "react";
import { Feature } from "../../app/LandingPage/types";
import { ShieldCheck, Headset, Lightning, Wrench, Question } from "@phosphor-icons/react";

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const renderIcon = () => {
    const iconClassName = "h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 shrink-0 group-hover:scale-115 group-hover:rotate-3 text-[#D71920] dark:text-red-400";

    switch (feature.icon) {
      case "ShieldCheck":
        return <ShieldCheck className={iconClassName} />;
      case "Headset":
        return <Headset className={iconClassName} />;
      case "Lightning":
        return <Lightning className={iconClassName} />;
      case "Wrench":
        return <Wrench className={iconClassName} />;
      default:
        return <Question className={iconClassName} />;
    }
  };

  const bgClass = "bg-red-50 dark:bg-red-950/30";

  return (
    <div className="group bg-white border border-[#E5E7EB] rounded-[24px] p-8 hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out dark:bg-slate-900/50 dark:border-slate-800 dark:hover:shadow-none">
      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${bgClass} flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300`}>
        {renderIcon()}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 font-heading dark:text-slate-100 text-left">
        {feature.title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 leading-normal sm:leading-relaxed dark:text-slate-400 text-left">
        {feature.description}
      </p>
    </div>
  );
}
