import { Navbar } from "./navbar";
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";

// Images for the hero marquee
const HERO_IMAGES = [
  "/hero/1.jpeg",
  "/hero/2.jpeg",
  "/hero/3.jpeg",
  "/hero/4.jpeg",
  "/hero/5.jpeg",
  "/hero/6.jpeg",
  "/hero/7.jpeg",
  "/hero/8.jpeg",
  "/hero/9.jpeg",
  "/hero/10.jpeg",
  "/hero/11.jpeg",
  "/hero/12.jpeg",
  "/hero/13.jpeg",
  "/hero/14.jpeg",
  "/hero/15.jpeg",
  "/hero/16.jpeg",
  "/hero/17.jpeg",
  "/hero/18.jpeg",
  "/hero/19.jpeg",
  "/hero/20.jpeg",
];

export const HeroSection = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatedMarqueeHero
          tagline="Tu ecosistema del bienestar"
          title={
            <>
              Donde tu transformación sucede
            </>
          }
          description="Explora expertos, programas, experiencias, restaurantes y espacios diseñados para acompañarte en tu bienestar físico, mental, emocional, espiritual y social. Aquí tu cambio sí toma forma."
          ctaText="Encuentra a tu experto"
          ctaHref="/explore"
          images={HERO_IMAGES}
        />
      </main>
    </div>
  );
};
