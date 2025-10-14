import { Metadata } from 'next';
import { generateStaticMetadata, generateStructuredData } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import { FeaturesSection } from "@/components/shared/fearures-section";
import { HeroSection } from "@/components/shared/hero-section";
import { LogoClouds } from "@/components/shared/logo-clouds";
import { TestimonialsSection } from "@/components/shared/testimonials-section";

export const metadata: Metadata = generateStaticMetadata({
  title: 'Holistia - Plataforma de Salud Integral y Bienestar en México',
  description: 'Conecta con profesionales de la salud certificados en México. Consultas presenciales y en línea para tu bienestar integral. Psicólogos, terapeutas, coaches y más. Reserva tu cita hoy.',
  keywords: [
    'psicólogos México',
    'terapeutas México',
    'consultas online',
    'salud mental México',
    'bienestar emocional',
    'terapia psicológica',
    'coaching México',
    'consultas presenciales',
    'profesionales de la salud',
    'eventos de bienestar',
    'workshops de salud mental',
  ],
  path: '/',
});

const structuredData = generateStructuredData('website', {});

export default function HomePage() {
  return (
    <>
      <StructuredData data={structuredData} />
      <HeroSection />
      <FeaturesSection />
      <LogoClouds />
      <TestimonialsSection />
    </>
  );
}
