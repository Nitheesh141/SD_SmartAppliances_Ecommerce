import React from "react";
import SectionContainer from "../shared/SectionContainer";
import CTAButton from "../shared/CTAButton";
import { Hammer, Users, Briefcase, Question } from "@phosphor-icons/react";
import { CommercialSection as CommercialSectionType } from "../../app/LandingPage/types";

interface CommercialSectionProps {
  data: CommercialSectionType;
}

export default function CommercialSection({ data }: CommercialSectionProps) {
  const renderIcon = (index: number) => {
    const iconProps = { size: 20, className: "text-red-400" };
    switch (index) {
      case 0:
        return <Hammer {...iconProps} />;
      case 1:
        return <Briefcase {...iconProps} />;
      case 2:
        return <Users {...iconProps} />;
      default:
        return <Question {...iconProps} />;
    }
  };

  return (
    <SectionContainer
      id="commercial"
      bgClass="relative bg-slate-900 overflow-hidden py-12 md:py-16"
    >
      {/* Visual background image with strong gradient overlay */}
      <div className="absolute inset-0 z-0 opacity-20">
        <img
          src={data.image}
          alt={data.heading}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-950 mix-blend-multiply" />
      </div>

      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content (relative z-10) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-white">
        {/* Text Area */}
        <div className="lg:col-span-7 text-left flex flex-col items-start">
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-red-300 bg-red-950/80 border border-red-800 rounded-full mb-4 uppercase">
            {data.eyebrow}
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight leading-tight mb-4">
            {data.heading}
          </h2>
          <p className="text-xs md:text-sm text-slate-350 leading-relaxed mb-8 max-w-xl">
            {data.description}
          </p>

          {/* Quick Value Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-8">
            {data.bullets.map((bullet, index) => {
              const [title, desc] = bullet.split(": ");
              return (
                <div key={index} className="flex gap-3">
                  <div className="p-2 h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                    {renderIcon(index)}
                  </div>
                  <div className="flex flex-col text-left">
                    <strong className="text-xs font-bold text-white leading-tight">{title}</strong>
                    {desc && <span className="text-4xs text-slate-400 mt-0.5">{desc}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4">
            <CTAButton
              variant="primary"
              size="md"
              className="!bg-[#D71920] hover:!bg-[#b8141a] !border-[#D71920] !text-white font-bold shadow-lg shadow-red-600/20 animate-pulse"
              asLink
              href={data.primaryCTA.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.primaryCTA.label}
            </CTAButton>
            <CTAButton
              variant="outline"
              size="md"
              className="text-white border-white/20 hover:bg-white/10 hover:border-white/30 dark:hover:bg-white/10"
              asLink
              href={data.secondaryCTA.href}
            >
              {data.secondaryCTA.label}
            </CTAButton>
          </div>
        </div>

        {/* Dynamic Mock Layout / Form Preview card */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <h3 className="text-base font-bold font-heading text-white mb-2 text-left">
            Inquire for {data.badgeLabel} Solutions
          </h3>
          <p className="text-3xs text-slate-300 mb-6 text-left">
            Share your commercial kitchen specifications and receive a customized quote within 24 business hours.
          </p>
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Business Name"
              className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
              required
            />
            <input
              type="email"
              placeholder="Business Email"
              className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
              required
            />
            <textarea
              placeholder="Tell us about your kitchen requirements (e.g. Grinder capacity, numbers)"
              className="w-full h-20 bg-slate-950/40 border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 resize-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#D71920] hover:bg-[#b8141a] text-white font-bold py-2.5 rounded-lg text-xs transition-colors duration-300 cursor-pointer shadow-lg shadow-red-600/10"
            >
              Submit Inquiry
            </button>
          </form>
        </div>
      </div>
    </SectionContainer>
  );
}
