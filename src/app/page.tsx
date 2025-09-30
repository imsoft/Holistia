import { FeaturesSection } from "@/components/shared/fearures-section";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/shared/hero-section";
import { LogoClouds } from "@/components/shared/logo-clouds";
import { TestimonialsSection } from "@/components/shared/testimonials-section";

const Home = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <LogoClouds />
      <Footer />
    </>
  );
};

export default Home;
