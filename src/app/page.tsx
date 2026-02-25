import { Metadata } from 'next';
import { generateStaticMetadata, generateStructuredData } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import { FeaturesSection } from "@/components/shared/fearures-section";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/shared/hero-section";
import { LogoClouds } from "@/components/shared/logo-clouds";
import { TestimonialsSection } from "@/components/shared/testimonials-section";
import { ExploreSection } from "@/components/shared/explore-section";
import { CompaniesCtaSection } from "@/components/shared/companies-cta-section";

export const metadata: Metadata = generateStaticMetadata({
  title: 'Holistia - Plataforma de Salud Integral y Bienestar en México',
  description: 'Plataforma líder de salud integral en México. Conecta con psicólogos certificados, terapeutas, coaches y nutriólogos. Consultas presenciales y online. Reserva tu cita hoy y transforma tu bienestar.',
  keywords: [
    'psicólogos certificados México',
    'terapeutas México',
    'consultas psicológicas online',
    'terapia online México',
    'salud mental México',
    'bienestar emocional',
    'terapia psicológica',
    'coaching México',
    'nutriólogos certificados',
    'consultas presenciales',
    'consultas virtuales',
    'eventos de bienestar',
    'talleres de salud mental',
    'workshops bienestar',
    'meditación guiada',
    'mindfulness México',
  ],
  path: '/',
});

const structuredData = generateStructuredData('website', {});

export default function HomePage() {
  return (
    <>
      <StructuredData data={structuredData} />
      <HeroSection />
<ExploreSection />
      <FeaturesSection />
      <CompaniesCtaSection />
      <LogoClouds />
      <TestimonialsSection />
      <Footer />
    </>
  );
}
