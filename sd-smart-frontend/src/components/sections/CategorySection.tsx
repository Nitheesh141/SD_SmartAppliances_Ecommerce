import React from "react";
import { Category } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import CategoryCard from "../cards/CategoryCard";
import ScrollReveal from "../animations/ScrollReveal";

interface CategorySectionProps {
  categories: Category[];
}

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <SectionContainer id="categories" bgClass="bg-white dark:bg-slate-950">
      <ScrollReveal direction="up">
        <SectionHeader
          badge="CATEGORIES"
          title="Shop by Product Category"
          subtitle="Explore our premium range of pressure cookers, non-stick cookware, mixer grinders, LPG stoves, and high-performance wet grinders built for home and commercial kitchens."
        />
      </ScrollReveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {categories.map((category, idx) => (
          <ScrollReveal key={category.id} delay={idx * 100} direction="up">
            <CategoryCard category={category} />
          </ScrollReveal>
        ))}
      </div>
    </SectionContainer>
  );
}
