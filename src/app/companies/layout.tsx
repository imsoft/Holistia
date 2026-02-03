import { Metadata } from "next";
import { generateStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = generateStaticMetadata({
  title: "Holistia para Empresas - Bienestar Corporativo",
  description:
    "Programas de bienestar integral para empresas en México. Salud mental, prevención de burnout, talleres y retos para equipos. Mejora el engagement y la productividad.",
  keywords: [
    "bienestar corporativo",
    "salud mental empresas",
    "wellness corporativo México",
    "programas bienestar equipos",
    "prevención burnout",
    "talleres bienestar empresas",
    "Holistia empresas",
  ],
  path: "/companies",
});

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
