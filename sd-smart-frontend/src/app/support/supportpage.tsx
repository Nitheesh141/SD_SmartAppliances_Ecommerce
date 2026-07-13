"use client";
import { ENV } from "@/config/env";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { 
  ClipboardList, 
  ShieldCheck, 
  Truck, 
  Eye, 
  Wrench, 
  Sparkles, 
  Package, 
  CheckCircle2, 
  ChevronDown, 
  Phone, 
  Mail, 
  Clock, 
  FileSignature, 
  HelpCircle 
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqsList: FAQItem[] = [
  {
    question: "How do I register my product warranty?",
    answer: "You can register your product warranty by clicking the 'Register Warranty' action card above, entering your purchase details (invoice details and product serial number), and uploading your proof of purchase. Registered warranties let you easily request support."
  },
  {
    question: "How can I raise a service request?",
    answer: "To raise a service request, click on 'Raise Ticket' under the action cards. Select your registered product, choose the category of issue, and submit the form. Our technicians will validate your request within 24 hours."
  },
  {
    question: "What documents are required for warranty validation?",
    answer: "For validating your warranty, you need a copy of the official purchase invoice showcasing the seller name, purchase date, product model name, and serial number. A digital copy (PDF or image) is accepted during registration."
  },
  {
    question: "How do I track my service request?",
    answer: "You can track any active requests by clicking 'Track Request' or visiting the Service Requests tab in your customer/distributor account dashboard. Real-time updates on inspection, repair, and delivery stages are shown."
  },
  {
    question: "What happens if my warranty has expired?",
    answer: "If your appliance warranty has expired, you can still raise service requests. Our technical team will inspect the product and issue a cost estimate. Repairs will commence only after you approve the estimate."
  },
  {
    question: "How long does the service process take?",
    answer: "Standard repairs and services typically take 3 to 7 business days. The exact duration depends on transit time, parts availability, and the complexity of the inspection/repair requirements."
  }
];

const serviceSteps = [
  { label: "Raise Service Request", desc: "Submit appliance issue ticket", icon: ClipboardList },
  { label: "Warranty Validation", desc: "Verify registration details", icon: ShieldCheck },
  { label: "Pickup Scheduling", desc: "Convenient logistics collection", icon: Truck },
  { label: "Product Inspection", desc: "Expert diagnostics & testing", icon: Eye },
  { label: "Repair / Service", desc: "Genuine parts replacements", icon: Wrench },
  { label: "Quality Check", desc: "Rigorous performance tests", icon: Sparkles },
  { label: "Ready for Delivery", desc: "Secure packaging for return", icon: Package },
  { label: "Delivered Back to Customer", desc: "Happy smart cooking!", icon: CheckCircle2 }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [supportInfo, setSupportInfo] = useState({
    phone: "+91 80 4455 6677",
    email: "support@sdsmart.in",
    hours: "Mon-Sat | 9 AM - 6 PM"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/settings`);
        const data = await res.json();
        if (data.success && data.settings) {
          setSupportInfo({
            phone: data.settings.seller_phone || "+91 80 4455 6677",
            email: data.settings.seller_email || "support@sdsmart.in",
            hours: "Mon-Sat | 9 AM - 6 PM"
          });
        }
      } catch (err) {
        console.warn("Failed to fetch settings from API, using default support info.", err);
      }
    };
    fetchSettings();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      <Header navLinks={navLinks} />

      <main className="flex-1">
        {/* SECTION 1: HERO SECTION */}
        <section className="relative bg-slate-50 dark:bg-slate-900/40 py-20 overflow-hidden border-b border-slate-100 dark:border-slate-900">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-3">HELP CENTER</p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
              Customer Support
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Need help with your SD SMART appliances? We are here to support you. You can register your product warranty, raise a service request, track existing requests, and find answers to frequently asked questions.
            </p>
          </div>
        </section>

        {/* SECTION 2: QUICK ACTION CARDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Register Warranty */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-[#D71920]/45 hover:-translate-y-1 transition-all duration-300 flex flex-col text-left">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center text-[#D71920] mb-5">
                <FileSignature size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Register Warranty</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                Register your purchased product and activate warranty coverage.
              </p>
              <Link href="/warranty-registration">
                <span className="inline-flex items-center justify-center w-full bg-[#D71920] hover:bg-[#b8141a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
                  Register Warranty
                </span>
              </Link>
            </div>

            {/* Card 2: Raise Service Request */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-[#D71920]/45 hover:-translate-y-1 transition-all duration-300 flex flex-col text-left">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center text-[#D71920] mb-5">
                <Wrench size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Raise Service Request</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                Create a service ticket for appliance issues.
              </p>
              <Link href="/service-request">
                <span className="inline-flex items-center justify-center w-full bg-[#D71920] hover:bg-[#b8141a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
                  Raise Ticket
                </span>
              </Link>
            </div>

            {/* Card 3: Track Service Request */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-[#D71920]/45 hover:-translate-y-1 transition-all duration-300 flex flex-col text-left">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center text-[#D71920] mb-5">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Track Service Request</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                Check the status of your existing service requests.
              </p>
              <Link href="/service-request">
                <span className="inline-flex items-center justify-center w-full bg-[#D71920] hover:bg-[#b8141a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
                  Track Request
                </span>
              </Link>
            </div>

            {/* Card 4: FAQs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-[#D71920]/45 hover:-translate-y-1 transition-all duration-300 flex flex-col text-left">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center text-[#D71920] mb-5">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Frequently Asked Questions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                Browse common questions and answers.
              </p>
              <a href="#faqs">
                <span className="inline-flex items-center justify-center w-full bg-[#D71920] hover:bg-[#b8141a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
                  View FAQs
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 4: SERVICE PROCESS FLOW */}
        <section className="bg-slate-50 dark:bg-slate-900/30 py-16 border-y border-slate-100 dark:border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">WORKFLOW</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Service Process Flow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">How we care for your smart appliances, from registration to return.</p>
            </div>

            {/* Steps Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {serviceSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex flex-col items-center text-center bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm z-10">
                    {/* Badge Step Number */}
                    <div className="absolute top-3 right-3 text-3xs font-black text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">
                      Step 0{idx + 1}
                    </div>

                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-[#D71920] mb-4 border-2 border-white dark:border-slate-900 shadow-sm">
                      <Icon size={20} />
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1.5 leading-snug">
                      {step.label}
                    </h4>
                    <p className="text-4xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: FAQ SECTION */}
        <section id="faqs" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">QUESTIONS</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqsList.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 dark:text-slate-100 hover:text-[#D71920] dark:hover:text-red-400 transition-colors text-sm md:text-base cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown 
                      size={18} 
                      className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#D71920]" : ""}`} 
                    />
                  </button>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-[500px] border-t border-slate-100 dark:border-slate-800/60 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="p-5 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-left">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: CONTACT SUPPORT */}
        <section className="bg-slate-900 dark:bg-slate-950 py-16 text-white relative overflow-hidden">
          {/* Background visuals */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              <circle cx="90%" cy="10%" r="200" fill="red" filter="blur(80px)" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 text-left">
                <p className="text-3xs font-bold text-red-400 uppercase tracking-widest mb-3">GET IN TOUCH</p>
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4">
                  Still Have Questions?
                </h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md">
                  Our professional support teams are ready to handle your query. Get in touch with customer support directly.
                </p>
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Phone */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 mb-4">
                    <Phone size={18} />
                  </div>
                  <h4 className="text-2xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">Phone</h4>
                  <p className="text-xs font-bold text-white mt-1 leading-snug select-all">{supportInfo.phone}</p>
                </div>

                {/* Email */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 mb-4">
                    <Mail size={18} />
                  </div>
                  <h4 className="text-2xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">Email</h4>
                  <p className="text-xs font-bold text-white mt-1 leading-snug break-all select-all">{supportInfo.email}</p>
                </div>

                {/* Hours */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 mb-4">
                    <Clock size={18} />
                  </div>
                  <h4 className="text-2xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">Hours</h4>
                  <p className="text-xs font-bold text-white mt-1 leading-snug">{supportInfo.hours}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
