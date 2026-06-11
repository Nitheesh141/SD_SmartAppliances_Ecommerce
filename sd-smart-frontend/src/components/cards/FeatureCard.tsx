import React from "react";
import { Feature } from "../../app/LandingPage/types";
import { ShieldCheck, DeviceMobile, Leaf, SpeakerSlash, Question } from "@phosphor-icons/react";

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const renderIcon = () => {
    const iconProps = {
      size: 24,
      className: "text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300",
    };

    switch (feature.icon) {
      case "ShieldCheck":
        return <ShieldCheck {...iconProps} />;
      case "DeviceMobile":
        return <DeviceMobile {...iconProps} />;
      case "Leaf":
        return <Leaf {...iconProps} />;
      case "SpeakerSlash":
        return <SpeakerSlash {...iconProps} />;
      default:
        return <Question {...iconProps} />;
    }
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-100/30 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:shadow-none">
      <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center mb-5 dark:bg-teal-950/50">
        {renderIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2 font-heading dark:text-slate-100">
        {feature.title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400 text-left">
        {feature.description}
      </p>
    </div>
  );
}
