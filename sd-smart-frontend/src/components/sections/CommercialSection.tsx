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
    const iconProps = { size: 20, className: "text-[#D71920]" };
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
      bgClass="bg-white dark:bg-slate-950 py-8 md:py-12"
      className="!px-0 sm:!px-6 lg:!px-8 xl:!px-12"
    >
      <div className="relative bg-[#080d19] rounded-3xl overflow-hidden px-6 py-10 md:px-12 md:py-14 border border-slate-800/80 shadow-2xl">
        {/* Visual background image with strong gradient overlay */}
        <div className="absolute inset-0 z-0 opacity-15">
          <img
            src={data.image}
            alt={data.heading}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-slate-950 mix-blend-multiply" />
        </div>

        {/* Decorative accent glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Main Content (relative z-10) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-white">
          {/* Text Area */}
          <div className="lg:col-span-7 text-left flex flex-col items-start lg:pr-6">
            <span className="inline-flex items-center px-3 py-1 text-3xs font-bold tracking-wider text-red-400 bg-red-950/40 border border-red-900/50 rounded-full mb-4 uppercase">
              {data.eyebrow}
            </span>
            <h2 className="text-3xl md:text-[40px] font-heading font-black tracking-tight leading-tight mb-4 text-white">
              {data.heading}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-8 max-w-xl">
              {data.description}
            </p>

            {/* Quick Value Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-10">
              {data.bullets.map((bullet, index) => {
                const [title, desc] = bullet.split(": ");
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2.5 h-11 w-11 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                      {renderIcon(index)}
                    </div>
                    <div className="flex flex-col text-left">
                      <strong className="text-xs font-bold text-white leading-snug">{title}</strong>
                      {desc && <span className="text-4xs text-slate-400 mt-1 leading-normal">{desc}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4">
              <CTAButton
                variant="primary"
                size="md"
                className="!bg-[#D71920] hover:!bg-[#b8141a] !border-[#D71920] !text-white font-bold rounded-xl px-6 py-3 shadow-lg shadow-red-600/20 transition-all duration-300"
                asLink
                href={data.primaryCTA.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {data.primaryCTA.label}
              </CTAButton>
              {data.secondaryCTA?.label && (
                <CTAButton
                  variant="outline"
                  size="md"
                  className="text-white border-white/25 hover:bg-white/10 hover:border-white/40 dark:hover:bg-white/10 rounded-xl px-6 py-3 transition-all duration-300"
                  asLink
                  href={data.secondaryCTA.href}
                >
                  {data.secondaryCTA.label}
                </CTAButton>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-5 bg-[#0d1527]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h3 className="text-sm md:text-base font-bold font-heading text-white mb-2 text-left tracking-tight">
              Inquire for {data.badgeLabel} Solutions
            </h3>
            <p className="text-3xs text-slate-400 mb-6 text-left leading-relaxed">
              Share your commercial kitchen specifications and receive a customized quote within 24 business hours.
            </p>
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input
                  type="text"
                  placeholder="Business Name"
                  className="w-full bg-[#080d19]/80 border border-slate-800/80 hover:border-slate-750 focus:border-red-500 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Business Email"
                  className="w-full bg-[#080d19]/80 border border-slate-800/80 hover:border-slate-750 focus:border-red-500 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Tell us about your kitchen requirements (e.g. Grinder capacity, numbers)"
                  className="w-full h-24 bg-[#080d19]/80 border border-slate-800/80 hover:border-slate-750 focus:border-red-500 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none resize-none transition-colors duration-200 leading-relaxed"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#D71920] hover:bg-[#b8141a] text-white font-extrabold py-3.5 rounded-xl text-xs transition-all duration-300 cursor-pointer shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.98]"
              >
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
