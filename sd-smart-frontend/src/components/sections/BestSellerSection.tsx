import React from "react";
import { Product } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import ProductCard from "../cards/ProductCard";
import ScrollReveal from "../animations/ScrollReveal";

interface BestSellerSectionProps {
  products: Product[];
}

export default function BestSellerSection({ products }: BestSellerSectionProps) {
  return (
    <SectionContainer id="best-sellers" bgClass="bg-slate-50/50 dark:bg-slate-900/10">
      <ScrollReveal direction="up">
        <SectionHeader
          badge="BESTSELLERS"
          title="Most Loved Kitchen Appliances"
          subtitle="Our customer-favorite appliances designed for durability, ease of operation, and smart kitchen integrations."
        />
      </ScrollReveal>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {products.map((product, idx) => (
          <ScrollReveal key={product.id} delay={idx * 100} direction="up">
            <ProductCard product={product} />
          </ScrollReveal>
        ))}
      </div>
    </SectionContainer>
  );
}
