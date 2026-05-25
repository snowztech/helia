import { Nav } from "./_components/nav";
import { Hero } from "./_components/hero";
import { Features } from "./_components/features";
import { Pricing } from "./_components/pricing";
import { FAQ } from "./_components/faq";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";
import { RevealOnScroll } from "./_components/reveal";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
