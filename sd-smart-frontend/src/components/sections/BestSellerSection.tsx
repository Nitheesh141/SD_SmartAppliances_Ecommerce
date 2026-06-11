import React from "react";
import { Product } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import SectionHeader from "../shared/SectionHeader";
import ProductCard from "../cards/ProductCard";

interface BestSellerSectionProps {
  products: Product[];
}

export default function BestSellerSection({ products }: BestSellerSectionProps) {
  return (
    <SectionContainer id="best-sellers" bgClass="bg-slate-50/50 dark:bg-slate-900/10">
      <SectionHeader
        badge="BESTSELLERS"
        title="Most Loved Kitchen Appliances"
        subtitle="Our customer-favorite appliances designed for durability, ease of operation, and smart kitchen integrations."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </SectionContainer>
  );
}
