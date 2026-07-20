import React from "react";
import { FeaturedProduct } from "../../app/LandingPage/types";
import SectionContainer from "../shared/SectionContainer";
import ProductPrice from "../shared/ProductPrice";
import BadgePill from "../shared/BadgePill";
import CTAButton from "../shared/CTAButton";
import { Cpu, ShieldCheck, Gear } from "@phosphor-icons/react";
import ScrollReveal from "../animations/ScrollReveal";
import { useAuth } from "@/providers/AuthProvider";
import EnquiryModal from "../shared/EnquiryModal";

interface FeaturedProductSectionProps {
  product: FeaturedProduct;
}

export default function FeaturedProductSection({ product }: FeaturedProductSectionProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "specs" | "features">("overview");
  const isImageLeft = product.imagePosition === "left";
  const { isAuthenticated, user } = useAuth();
  const isDistributor = isAuthenticated && user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");
  const [isEnquiryOpen, setIsEnquiryOpen] = React.useState(false);

  return (
    <SectionContainer id={`featured-${product.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Image Column */}
        <ScrollReveal
          direction={isImageLeft ? "left" : "right"}
          className={`lg:col-span-6 relative flex justify-center w-full ${isImageLeft ? "" : "lg:order-last"}`}
        >
          <div className="absolute -inset-4 bg-red-500/5 rounded-2xl blur-2xl dark:bg-red-500/2 pointer-events-none w-full h-full" />
          <div className="relative aspect-square w-full max-w-md md:max-w-lg rounded-2xl overflow-hidden border border-slate-100 bg-white p-4 shadow-xl dark:bg-slate-900/60 dark:border-slate-800">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover object-center rounded-xl transition-transform duration-700 hover:scale-[1.03]"
              loading="lazy"
            />
            {product.eyebrow && (
              <div className="absolute top-8 left-8">
                <BadgePill variant="primary" className="shadow-md backdrop-blur-md !bg-red-650/90 !text-white border-none">
                  {product.eyebrow}
                </BadgePill>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Content Column */}
        <ScrollReveal
          direction={isImageLeft ? "right" : "left"}
          className="lg:col-span-6 flex flex-col items-start text-left w-full"
        >
          {/* Eyebrow / Tag */}
          <span className="text-3xs font-bold text-[#D71920] tracking-widest uppercase mb-2 dark:text-red-400">
            {product.eyebrow}
          </span>
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 leading-tight tracking-tight dark:text-slate-100">
            {product.name}
          </h2>

          {/* Pricing */}
          {isDistributor ? (
            <div className="mt-4">
              <button
                onClick={() => setIsEnquiryOpen(true)}
                className="py-3 px-6 border-2 border-[#D71920] hover:bg-red-50 dark:hover:bg-slate-800 text-[#D71920] hover:text-[#b8141a] text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
              >
                Enquiry for Price
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xs font-medium text-slate-400 uppercase tracking-wider">Starting from</span>
              <ProductPrice
                price={product.startingPrice}
                priceClass="text-2xl md:text-3xl font-extrabold text-[#D71920] dark:text-red-400"
              />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mt-8 flex border-b border-slate-100 w-full dark:border-slate-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs font-bold transition-all duration-300 border-b-2 mr-6 cursor-pointer ${
                activeTab === "overview"
                  ? "border-[#D71920] text-[#D71920] dark:text-red-400"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-3 text-xs font-bold transition-all duration-300 border-b-2 mr-6 cursor-pointer ${
                activeTab === "specs"
                  ? "border-[#D71920] text-[#D71920] dark:text-red-400"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`pb-3 text-xs font-bold transition-all duration-300 border-b-2 cursor-pointer ${
                activeTab === "features"
                  ? "border-[#D71920] text-[#D71920] dark:text-red-400"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Special Features
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6 min-h-[120px] w-full">
            {activeTab === "overview" && (
              <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                {product.description}
              </p>
            )}

            {activeTab === "specs" && product.specs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-900"
                  >
                    <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                      {spec.label}
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-350">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "features" && (
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-2.5">
                  <Cpu size={18} className="text-[#D71920] dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col text-left">
                    <strong className="text-xs text-slate-800 dark:text-slate-200">Intelligent Micro-controls</strong>
                    <span className="text-3xs text-slate-500 dark:text-slate-400">Embedded smart chips modulate heating patterns dynamically.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-[#D71920] dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col text-left">
                    <strong className="text-xs text-slate-800 dark:text-slate-200">Safety First Construction</strong>
                    <span className="text-3xs text-slate-500 dark:text-slate-400">Equipped with automatic pressure release valves and heat-resistant gaskets.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Gear size={18} className="text-[#D71920] dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col text-left">
                    <strong className="text-xs text-slate-800 dark:text-slate-200">Heavy-Duty Operation</strong>
                    <span className="text-3xs text-slate-500 dark:text-slate-400">Designed with copper-wound motors built to execute high-stress tasks continuously.</span>
                  </div>
                </li>
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4">
            <CTAButton variant="primary" size="md" asLink href={product.primaryCTA.href}>
              {product.primaryCTA.label}
            </CTAButton>
            <CTAButton variant="outline" size="md" asLink href={product.secondaryCTA.href}>
              {product.secondaryCTA.label}
            </CTAButton>
          </div>
        </ScrollReveal>
      </div>
      {isEnquiryOpen && (
        <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} productId={product.id} productName={product.name} />
      )}
    </SectionContainer>
  );
}
