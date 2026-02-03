import { Metadata } from "next";
import { generateStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = generateStaticMetadata({
  title: "Únete como profesional - Holistia",
  description:
    "Regístrate como profesional de salud integral en Holistia. Psicólogos, terapeutas, coaches y nutriólogos certificados pueden ofrecer consultas y conectar con pacientes.",
  keywords: [
    "ser profesional Holistia",
    "registro profesionales",
    "psicólogos plataforma",
    "terapeutas México",
    "coaches bienestar",
    "nutriólogos online",
  ],
  path: "/become-professional",
});

export default function BecomeProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
