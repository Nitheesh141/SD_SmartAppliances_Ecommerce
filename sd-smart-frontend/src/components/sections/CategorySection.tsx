import React from "react";
import { Category } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import CategoryCard from "../cards/CategoryCard";

interface CategorySectionProps {
  categories: Category[];
}

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <SectionContainer id="categories" bgClass="bg-white dark:bg-slate-950">
      <SectionHeader
        badge="CATEGORIES"
        title="Shop by Product Category"
        subtitle="Explore our engineered range of kitchen appliances, built with robust technologies to simplify and optimize your cooking experience."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </SectionContainer>
  );
}
