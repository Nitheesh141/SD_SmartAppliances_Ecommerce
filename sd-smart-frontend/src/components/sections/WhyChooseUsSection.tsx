import React from "react";
import { Feature } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import FeatureCard from "../cards/FeatureCard";

interface WhyChooseUsSectionProps {
  features: Feature[];
}

export default function WhyChooseUsSection({ features }: WhyChooseUsSectionProps) {
  return (
    <SectionContainer id="why-choose-us" bgClass="bg-white dark:bg-slate-950">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        {/* Title/Info column */}
        <div className="lg:col-span-1 text-left flex flex-col items-start">
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-teal-800 bg-teal-100/80 rounded-full mb-3 uppercase dark:bg-teal-950 dark:text-teal-300">
            WHY SD SMART
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 leading-tight tracking-tight dark:text-slate-100">
            Engineering the Future of Cooking
          </h2>
          <p className="mt-4 text-xs md:text-sm text-slate-500 font-sans leading-relaxed dark:text-slate-400">
            At SD Smart Appliances, we blend durable mechanical engineering with contemporary smart home integrations. Our appliances are designed to perform reliably under high-stress conditions while consuming less power and reducing kitchen noise.
          </p>
          <div className="mt-8">
            <a
              href="#timeline"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1.5 transition-colors duration-200 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Discover Our History Story →
            </a>
          </div>
        </div>

        {/* Grid of features column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
