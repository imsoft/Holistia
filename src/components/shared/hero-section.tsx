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
  "/hero/17.JPG",
  "/hero/18.jpg",
  "/hero/19.jpg",
  "/hero/20.JPG",
  "/hero/21.JPG",
  "/hero/22.JPG",
  "/hero/23.jpg",
  "/hero/24.JPG",
  "/hero/25.jpg",
  "/hero/26.JPG",
  "/hero/27.jpg",
  "/hero/28.jpg",
  "/hero/29.jpg",
  "/hero/30.jpg",
  "/hero/31.jpg",
  "/hero/32.JPG",
  "/hero/33.JPG",
  "/hero/34.JPG",
  "/hero/35.jpg",
  "/hero/36.jpg",
  "/hero/37.jpg",
  "/hero/38.JPG",
  "/hero/39.JPG",
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
