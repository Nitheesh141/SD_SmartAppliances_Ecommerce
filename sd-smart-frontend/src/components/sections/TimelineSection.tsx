import React from "react";
import { TimelineItem } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import TimelineCard from "../cards/TimelineCard";

interface TimelineSectionProps {
  items: TimelineItem[];
}

export default function TimelineSection({ items }: TimelineSectionProps) {
  return (
    <SectionContainer id="timeline" bgClass="bg-white dark:bg-slate-950">
      <SectionHeader
        badge="OUR STORY"
        title="Decade of Kitchen Innovation"
        subtitle="Since our humble beginnings, we have been innovating appliance structures and setting standards in quality and durability."
      />

      {/* Timeline wrapper */}
      <div className="relative w-full max-w-5xl mx-auto py-10 px-4">
        {/* Central Vertical Line for Desktop, Left Line for Mobile */}
        <div className="absolute top-0 bottom-0 left-8 md:left-1/2 w-0.5 bg-slate-100 -translate-x-1/2 dark:bg-slate-900 pointer-events-none" />

        {/* Timeline Items */}
        <div className="flex flex-col w-full">
          {items.map((item) => (
            <TimelineCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
