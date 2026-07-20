import React from "react";
import { ShieldCheck, Truck, Certificate, Headset, Question } from "@phosphor-icons/react";
import { TrustBadge } from "../../app/LandingPage/types";

interface TrustBadgesSectionProps {
  trustBadges: TrustBadge[];
}

export default function TrustBadgesSection({ trustBadges }: TrustBadgesSectionProps) {
  const renderIcon = (icon: string) => {
    const iconClassName = "h-5 w-5 sm:h-7 sm:w-7 text-[#D71920] shrink-0";
    switch (icon) {
      case "ShieldCheck":
        return <ShieldCheck className={iconClassName} weight="fill" />;
      case "Truck":
        return <Truck className={iconClassName} weight="fill" />;
      case "Certificate":
        return <Certificate className={iconClassName} weight="fill" />;
      case "Headset":
        return <Headset className={iconClassName} weight="fill" />;
      default:
        return <Question className={iconClassName} weight="fill" />;
    }
  };

  return (
    <div className="py-5 sm:py-6" style={{ backgroundColor: "#1A1A1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-4 sm:gap-6">
          {trustBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-start gap-2 sm:gap-4"
            >
              <div className="p-2 sm:p-3 bg-[#D71920]/10 rounded-lg shrink-0 flex items-center justify-center">
                {renderIcon(badge.icon)}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-xs sm:text-sm font-bold text-white dark:text-slate-100 leading-tight">
                  {badge.title}
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 dark:text-slate-500 leading-snug">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
