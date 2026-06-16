import React from "react";
import { Testimonial } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import TestimonialCard from "../cards/TestimonialCard";
import ScrollReveal from "../animations/ScrollReveal";

interface TestimonialSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialSection({ testimonials }: TestimonialSectionProps) {
  return (
    <SectionContainer id="testimonials" bgClass="bg-slate-50/50 dark:bg-slate-900/10">
      <ScrollReveal direction="up">
        <SectionHeader
          badge="REVIEWS"
          title="Trusted by Chefs & Home Cooks"
          subtitle="Hear directly from culinary professionals and smart homemakers who experience the reliability of SD Smart Appliances daily."
        />
      </ScrollReveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((testimonial, idx) => (
          <ScrollReveal key={testimonial.id} delay={idx * 120} direction="fade">
            <TestimonialCard testimonial={testimonial} />
          </ScrollReveal>
        ))}
      </div>
    </SectionContainer>
  );
}
