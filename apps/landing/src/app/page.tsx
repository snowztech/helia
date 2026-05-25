import { Nav } from "./_components/nav";
import { Hero } from "./_components/hero";
import { PlaysWith } from "./_components/plays-with";
import { Features } from "./_components/features";
import { HowItWorks } from "./_components/how-it-works";
import { WidgetShowcase } from "./_components/widget-showcase";
import { Stats } from "./_components/stats";
import { Pricing } from "./_components/pricing";
import { FAQ } from "./_components/faq";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PlaysWith />
        <Features />
        <HowItWorks />
        <WidgetShowcase />
        <Stats />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
