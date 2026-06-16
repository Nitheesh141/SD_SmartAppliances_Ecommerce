import React from "react";
import { ArrowRight, X, Tag } from "@phosphor-icons/react";
import { AnnouncementItem } from "../../app/LandingPage/types";

interface AnnouncementBarProps {
  announcements: AnnouncementItem[];
}

export default function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible || announcements.length === 0) return null;

  // Render first announcement for now
  const announcement = announcements[0];
  if (!announcement) return null;

  return (
    <div className="bg-slate-900 text-white py-2.5 px-4 relative flex items-center justify-center text-center select-none z-50">
      <div className="flex items-center justify-center gap-2 flex-wrap text-3xs font-medium tracking-wide">
        <span className="bg-[#D71920] text-white font-bold px-1.5 py-0.5 rounded-full uppercase text-4xs leading-none inline-flex items-center gap-1">
          <Tag size={10} weight="fill" /> Offer
        </span>
        <span>{announcement.text}</span>
        {announcement.href && (
          <a
            href={announcement.href}
            className="underline hover:text-red-400 inline-flex items-center gap-1 font-semibold transition-colors duration-200"
          >
            Shop Now <ArrowRight size={10} weight="bold" />
          </a>
        )}
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
      >
        <X size={14} weight="bold" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
