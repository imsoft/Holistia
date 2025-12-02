import { Navbar } from "./navbar";
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";

// Images for the hero marquee
const HERO_IMAGES = [
  "/hero/1.jpg",
  "/hero/2.JPG",
  "/hero/3.JPG",
  "/hero/4.jpg",
  "/hero/5.JPG",
  "/hero/6.jpg",
  "/hero/7.jpg",
  "/hero/8.JPG",
  "/hero/9.JPG",
  "/hero/10.JPG",
  "/hero/11.jpg",
  "/hero/12.JPG",
  "/hero/13.jpg",
  "/hero/14.jpg",
  "/hero/15.JPG",
  "/hero/16.JPG",
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
