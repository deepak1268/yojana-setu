import { Cta } from "@/components/landing/Cta";
import { EmiPreview } from "@/components/landing/EmiPreview";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PartnerPreview } from "@/components/landing/PartnerPreview";
import { Problem } from "@/components/landing/Problem";

export default function Home() {
  return (
    <div id="top" className="flex min-h-full flex-1 flex-col">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Features />
        <EmiPreview />
        <PartnerPreview />
        <HowItWorks />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
