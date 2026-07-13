"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { categories } from "../LandingPage/data/categories";
import { 
  ShieldCheck, 
  Award, 
  Zap, 
  Headphones, 
  Lightbulb, 
  Heart, 
  Gem, 
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  CheckCircle,
  Clock,
  TrendingUp,
  Store,
  Briefcase
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-neutral-800 dark:text-neutral-250">
      <Header navLinks={navLinks} />

      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-neutral-100 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-[#E11D2E]/10 text-[#E11D2E]">
                <Sparkles size={12} className="animate-pulse" />
                <span>About Us</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white leading-tight">
                About <span className="text-[#E11D2E]">SD Smart</span> Appliances
              </h1>
              <p className="text-lg sm:text-xl font-bold text-neutral-600 dark:text-neutral-350 leading-normal">
                Trusted Kitchen Appliance Manufacturer Delivering Quality, Innovation, and Reliability Across India.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
                SD Smart Appliances is committed to manufacturing premium-quality kitchen appliances designed for Indian homes and commercial kitchens. Every product is built with durability, safety, and customer satisfaction in mind.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/shop"
                  className="px-6 py-3 bg-[#E11D2E] hover:bg-[#c11524] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Explore Products</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 border border-neutral-300 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#E11D2E]/10 to-transparent rounded-3xl -rotate-2 scale-105"></div>
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800"
                alt="Premium kitchen appliance layout"
                className="relative z-10 w-full h-[350px] lg:h-[450px] object-cover rounded-3xl shadow-xl hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            
          </div>
        </div>
      </section>

      {/* SECTION 2 — OUR JOURNEY */}
      <section className="py-20 lg:py-24 bg-neutral-50/50 dark:bg-slate-900/10 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Our Journey
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              The evolution of SD Smart Appliances from distribution expertise to manufacturing leadership.
            </p>
          </div>

          {/* Alternating Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-5xl mx-auto">
            {[
              {
                period: "2016 – 2019",
                title: "Distribution Roots",
                desc: "Founder Mr. Vignesh worked as a distributor in the kitchen appliance industry. During these years, he gained deep market knowledge, understood customer needs, built strong distributor relationships, and identified opportunities to manufacture better quality products."
              },
              {
                period: "2020",
                title: "Inception of SD Smart",
                desc: "With years of industry experience, Mr. Vignesh established SD Smart Appliances and launched its own manufacturing unit to produce reliable, high-quality kitchen appliances."
              },
              {
                period: "2021 – Present",
                title: "Expansion Phase",
                desc: "The company expanded its product portfolio and began supplying directly to distributors and customers across multiple regions."
              },
              {
                period: "Today",
                title: "National Trust",
                desc: "SD Smart Appliances has built a trusted network of more than 500+ distributors and continues to grow by delivering quality products backed by dependable customer service and warranty support."
              }
            ].map((journey, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg bg-[#E11D2E]/10 text-[#E11D2E]">
                    {journey.period}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-[#E11D2E] transition-colors">
                    {journey.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-450 leading-relaxed">
                    {journey.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 3 — COMPANY VISION */}
      <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-[#E11D2E]/10 text-[#E11D2E]">
            <Compass size={12} />
            <span>Our Vision</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white leading-tight">
            Driven by Quality. Built on Trust.
          </h2>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-405 leading-relaxed max-w-2xl mx-auto">
            Our vision is to become one of India's most trusted kitchen appliance manufacturers by delivering innovative, durable, and affordable products that simplify everyday cooking.
          </p>
        </div>
      </section>

      {/* SECTION 4 — WHY SD SMART */}
      <section className="py-20 lg:py-24 bg-neutral-50/50 dark:bg-slate-900/10 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Why SD Smart
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Setting new standards in kitchen appliances through premium execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                icon: <ShieldCheck className="text-[#E11D2E]" size={24} />,
                title: "5-Year Warranty",
                desc: "Reliable products backed by dependable warranty support."
              },
              {
                icon: <Users className="text-[#E11D2E]" size={24} />,
                title: "500+ Distributor Network",
                desc: "Serving customers through an extensive distributor network across multiple regions."
              },
              {
                icon: <Award className="text-[#E11D2E]" size={24} />,
                title: "Premium Manufacturing",
                desc: "Products manufactured using quality-tested materials and modern production techniques."
              },
              {
                icon: <Headphones className="text-[#E11D2E]" size={24} />,
                title: "Dedicated Customer Support",
                desc: "Fast response, genuine spare parts, and efficient after-sales service."
              }
            ].map((card, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-[#E11D2E]/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{card.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 5 — OUR VALUES */}
      <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Our Values
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              The foundational pillars that support our operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: <Gem className="text-[#E11D2E]" size={24} />,
                title: "Quality First",
                desc: "We ensure only premium raw materials and ISO-grade processes pass our production floors."
              },
              {
                icon: <Lightbulb className="text-[#E11D2E]" size={24} />,
                title: "Innovation",
                desc: "We constantly research smart mechanisms, thermal speedups, and ergonomics to optimize user comfort."
              },
              {
                icon: <Heart className="text-[#E11D2E]" size={24} />,
                title: "Customer Satisfaction",
                desc: "We track and schedule technicians on-site, providing honest services and immediate query answers."
              }
            ].map((value, idx) => (
              <div 
                key={idx} 
                className="bg-neutral-50/50 dark:bg-slate-900/30 border border-neutral-100 dark:border-slate-800 rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-[#E11D2E]/10 text-[#E11D2E] rounded-full flex items-center justify-center">
                  {value.icon}
                </div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">{value.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 6 — MANUFACTURING EXCELLENCE */}
      <section className="py-20 lg:py-24 bg-neutral-50/50 dark:bg-slate-900/10 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Image */}
            <div className="lg:col-span-6">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800"
                alt="SD Smart assembly line"
                className="w-full h-[400px] object-cover rounded-3xl shadow-lg hover:scale-[1.01] transition-transform duration-300"
              />
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-[#E11D2E]/10 text-[#E11D2E]">
                <Award size={12} />
                <span>Production Standards</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                Manufacturing Excellence
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-350 leading-relaxed">
                By investing in high-grade assembly lines and implementing strict process checks, we build components that are meant to last a lifetime.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
                {[
                  "Modern manufacturing facility",
                  "Strict quality inspection",
                  "Premium raw materials",
                  "ISI standard production practices",
                  "Safe packaging",
                  "Nationwide supply chain"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <CheckCircle size={16} className="text-[#E11D2E] flex-shrink-0" />
                    <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7 — PRODUCT CATEGORIES */}
      <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Product Categories
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Explore our core segments built for domestic efficiency and commercial reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-left">
            {categories.map((cat, idx) => (
              <div 
                key={cat.id || idx} 
                className="bg-neutral-50/50 dark:bg-slate-900/30 border border-neutral-250/30 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="h-44 w-full overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wide text-neutral-800 dark:text-neutral-200">{cat.name}</h3>
                  <Link 
                    href={cat.href}
                    className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E] hover:text-[#c11524] transition-colors inline-flex items-center gap-1.5 pt-1"
                  >
                    <span>View Category</span>
                    <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 8 — OUR ACHIEVEMENTS */}
      <section className="py-20 lg:py-24 bg-neutral-50/50 dark:bg-slate-900/10 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Our Achievements
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Milestones built on commitment, distributor relationships, and customer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-center max-w-5xl mx-auto">
            {[
              { stat: "2016", label: "Industry Experience Started", icon: <Briefcase size={20} className="text-[#E11D2E]" /> },
              { stat: "2020", label: "Manufacturing Unit Established", icon: <Compass size={20} className="text-[#E11D2E]" /> },
              { stat: "500+", label: "Trusted Distributors", icon: <Store size={20} className="text-[#E11D2E]" /> },
              { stat: "1,000+", label: "Satisfied Customers", icon: <Users size={20} className="text-[#E11D2E]" /> },
              { stat: "100+", label: "Retail Partners", icon: <TrendingUp size={20} className="text-[#E11D2E]" /> }
            ].map((achievement, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-[#E11D2E]/5 rounded-full flex items-center justify-center mx-auto">
                  {achievement.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">{achievement.stat}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 leading-normal">{achievement.label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 9 — CUSTOMER COMMITMENT */}
      <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 border-b border-neutral-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-5 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-[#E11D2E]/10 text-[#E11D2E]">
                <Users size={12} />
                <span>Our Promise</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                Customer Commitment
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                We believe that reliable products are only as good as the trust and transparency backing them. Our promise represents our commitment to every kitchen we serve.
              </p>
            </div>

            {/* Right List */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              {[
                { title: "Premium Quality Products", desc: "Using top-tier components, thick housings, and tested shock-proof wiring." },
                { title: "Transparent Warranty Support", desc: "No hidden clauses or parsing delays. Validate and file tickets instantly online." },
                { title: "Fast Customer Service", desc: "On-site visits scheduled quickly to minimize any kitchen disruption." },
                { title: "Genuine Spare Parts", desc: "Direct manufacturer supply of authentic parts to guarantee safety." },
                { title: "Continuous Product Innovation", desc: "Constantly upgrading thermal flow patterns, efficiency, and motor acoustics." }
              ].map((promise, idx) => (
                <div 
                  key={idx} 
                  className="p-6 border border-neutral-200/70 dark:border-slate-800/80 bg-neutral-50/20 dark:bg-slate-900/40 rounded-2xl space-y-2 hover:border-[#E11D2E]/25 transition-all"
                >
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#E11D2E]" />
                    <span>{promise.title}</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">{promise.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 10 — CALL TO ACTION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#1C1C1C] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wide">
            Join Thousands Who Trust SD Smart Appliances
          </h2>
          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
            Upgrade your culinary workspace with our premium kitchen solutions or join our network as an authorized dealer.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/shop"
              className="px-8 py-3 bg-white hover:bg-neutral-50 text-[#E11D2E] text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-black/10 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explore Products</span>
            </Link>
            <Link
              href="/auth/distributor-signup"
              className="px-8 py-3 bg-transparent hover:bg-white/10 border-2 border-white text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Become a Distributor</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
