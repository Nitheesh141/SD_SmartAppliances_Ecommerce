import React from "react";
import { Feature } from "../../app/LandingPage/types";
import { ShieldCheck, DeviceMobile, Leaf, SpeakerSlash, Question } from "@phosphor-icons/react";

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const renderIcon = () => {
    const iconClassName = "h-5 w-5 sm:h-6 sm:w-6 text-[#D71920] dark:text-red-400 group-hover:scale-110 transition-transform duration-300 shrink-0";

    switch (feature.icon) {
      case "ShieldCheck":
        return <ShieldCheck className={iconClassName} />;
      case "DeviceMobile":
        return <DeviceMobile className={iconClassName} />;
      case "Leaf":
        return <Leaf className={iconClassName} />;
      case "SpeakerSlash":
        return <SpeakerSlash className={iconClassName} />;
      default:
        return <Question className={iconClassName} />;
    }
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-xl p-3.5 sm:p-6 hover:shadow-lg hover:shadow-slate-100/30 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:shadow-none">
      <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg bg-red-50 flex items-center justify-center mb-3 sm:mb-5 dark:bg-red-950/50">
        {renderIcon()}
      </div>
      <h3 className="text-xs sm:text-base font-bold text-slate-900 mb-1 sm:mb-2 font-heading dark:text-slate-100">
        {feature.title}
      </h3>
      <p className="text-[10px] sm:text-xs text-slate-500 leading-normal sm:leading-relaxed dark:text-slate-400 text-left">
        {feature.description}
      </p>
    </div>
  );
}
