import { Navbar } from "./navbar";
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";

// Images for the hero marquee
const HERO_IMAGES = [
  "/hero/1.jpg",
  // "/hero/2.jpg",
  // "/hero/3.jpg",
  "/hero/4.jpg",
  // "/hero/5.jpg",
  "/hero/6.jpg",
  "/hero/7.jpg",
  // "/hero/8.jpg",
  // "/hero/9.jpg",
  // "/hero/10.jpg",
  "/hero/11.jpg",
  // "/hero/12.jpg",
  "/hero/13.jpg",
  "/hero/14.jpg",
  // "/hero/15.jpg",
  // "/hero/16.jpg",
  // "/hero/17.jpg",
  "/hero/18.jpg",
  "/hero/19.jpg",
  // "/hero/20.jpg",
  // "/hero/21.jpg",
  // "/hero/22.jpg",
  "/hero/23.jpg",
  // "/hero/24.jpg",
  "/hero/25.jpg",
  // "/hero/26.jpg",
  "/hero/27.jpg",
  "/hero/28.jpg",
  "/hero/29.jpg",
  "/hero/30.jpg",
  "/hero/31.jpg",
  // "/hero/32.jpg",
  // "/hero/33.jpg",
  // "/hero/34.jpg",
  "/hero/35.jpg",
  "/hero/36.jpg",
  "/hero/37.jpg",
  // "/hero/38.jpg",
  // "/hero/39.jpg",
];

export const HeroSection = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatedMarqueeHero
          tagline="Tu acceso al wellness integral"
          title={
            <>
              ¿Por dónde quieres
              <br />
              empezar a sanar hoy?
            </>
          }
          description="Encuentra expertos, experiencias, talleres, centros, restaurantes y espacios que acompañan tu equilibrio mental, físico, emocional, espiritual y social."
          ctaText="Encuentra a tu experto"
          ctaHref="/explore"
          images={HERO_IMAGES}
        />
      </main>
    </div>
  );
};
