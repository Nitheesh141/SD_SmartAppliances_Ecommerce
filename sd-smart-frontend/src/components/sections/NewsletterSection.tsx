import React from "react";
import SectionContainer from "../shared/SectionContainer";
import { EnvelopeSimple, Bell } from "@phosphor-icons/react";

export default function NewsletterSection() {
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <SectionContainer id="newsletter" bgClass="bg-white dark:bg-slate-950">
      <div className="relative max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-950 p-8 md:p-12 shadow-2xl text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 h-64 w-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Bell Icon Wrapper */}
          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 mb-6 shadow-lg">
            <Bell size={24} weight="duotone" className="animate-swing" />
          </div>

          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white leading-tight tracking-tight max-w-lg mb-3">
            Stay Updated with Kitchen Tech
          </h2>
          <p className="text-3xs md:text-xs text-slate-300 max-w-md mb-8 leading-relaxed">
            Subscribe to receive priority notifications on product launches, energy-saving advice, smart home tips, and exclusive discount codes.
          </p>

          {subscribed ? (
            <div className="bg-teal-950/40 border border-teal-800 rounded-xl py-4 px-8 max-w-sm flex items-center gap-3 text-teal-300 animate-in fade-in zoom-in-95 duration-300">
              <EnvelopeSimple size={20} weight="fill" />
              <span className="text-xs font-semibold text-left">Thank you for subscribing! Keep an eye on your inbox.</span>
            </div>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
              onSubmit={handleSubmit}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 bg-slate-950/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                required
              />
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-6 py-3 rounded-lg text-xs transition-colors duration-300 cursor-pointer shadow-lg shadow-teal-500/15 shrink-0"
              >
                Subscribe Now
              </button>
            </form>
          )}
        </div>
      </div>
    </SectionContainer>
  );
}
