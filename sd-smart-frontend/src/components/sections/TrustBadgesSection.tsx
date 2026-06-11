import React from "react";
import { ShieldCheck, Truck, Certificate, Headset, Question } from "@phosphor-icons/react";
import { TrustBadge } from "../../app/LandingPage/types";

interface TrustBadgesSectionProps {
  trustBadges: TrustBadge[];
}

export default function TrustBadgesSection({ trustBadges }: TrustBadgesSectionProps) {
  const renderIcon = (icon: string) => {
    const iconProps = { size: 28, className: "text-red-600" };
    switch (icon) {
      case "ShieldCheck":
        return <ShieldCheck {...iconProps} weight="fill" />;
      case "Truck":
        return <Truck {...iconProps} weight="fill" />;
      case "Certificate":
        return <Certificate {...iconProps} weight="fill" />;
      case "Headset":
        return <Headset {...iconProps} weight="fill" />;
      default:
        return <Question {...iconProps} weight="fill" />;
    }
  };

  return (
    <div className="py-6" style={{ backgroundColor: "#1A1A1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-start gap-4"
            >
              <div className="p-3 bg-red-50/10 rounded-lg shrink-0 flex items-center justify-center">
                {renderIcon(badge.icon)}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-sm font-bold text-white dark:text-slate-100">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">
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
