"use client";

import {
  MarketingNav,
  HeroSection,
  TrustStrip,
  FeaturesSection,
  HowItWorksSection,
  UseCasesSection,
  FAQSection,
  CTASection,
  MarketingFooter,
} from "@/components/marketing";

export default function Marketing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <MarketingNav />
      <HeroSection />
      <TrustStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />
      <FAQSection />
      <CTASection />
      <MarketingFooter />
    </div>
  );
}