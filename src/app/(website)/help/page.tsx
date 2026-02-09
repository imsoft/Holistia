import { Metadata } from "next";
import { generateStaticMetadata, generateFAQSchema } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { HelpPageClient } from "./help-page-client";
import { getAllFaqsForSchema } from "./faq-data";

export const metadata: Metadata = generateStaticMetadata({
  title: "Centro de Ayuda y FAQ - Holistia",
  description:
    "Preguntas frecuentes para profesionales (comisiones, cancelaciones, facturación) y pacientes (cómo cancelar, reembolsos, primera cita). Envía tu solicitud y te respondemos en 24-48 h.",
  keywords: [
    "ayuda Holistia",
    "FAQ Holistia",
    "preguntas frecuentes",
    "comisiones profesionales",
    "cancelar cita",
    "reembolso",
    "soporte Holistia",
  ],
  path: "/help",
});

export default function HelpPage() {
  const faqSchema = generateFAQSchema(getAllFaqsForSchema());
  return (
    <div className="min-h-screen bg-background">
      <StructuredData data={faqSchema} />
      <HelpPageClient />
    </div>
  );
}
