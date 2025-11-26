import { Navbar } from "./navbar";
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";

// Images for the hero marquee
const HERO_IMAGES = [
  "/hero/1.png",
  "/hero/2.png",
  "/hero/3.png",
  "/hero/4.png",
  "/hero/5.png",
  "/hero/1.png",
  "/hero/2.png",
  "/hero/3.png",
  "/hero/4.png",
  "/hero/5.png",
  "/hero/1.png",
  "/hero/2.png",
  "/hero/3.png",
  "/hero/4.png",
  "/hero/5.png",
  "/hero/1.png",
  "/hero/2.png",
  "/hero/3.png",
  "/hero/4.png",
  "/hero/5.png",
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
