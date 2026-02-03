import { Metadata } from "next";
import { BASE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Feed | Holistia",
  description:
    "Publicaciones de la comunidad Holistia. Progreso en retos de bienestar, hábitos y experiencias compartidas por nuestros usuarios.",
  openGraph: {
    url: `${BASE_URL}/feed`,
    title: "Feed de la comunidad | Holistia",
    description:
      "Descubre las publicaciones de la comunidad Holistia. Progreso en retos de bienestar y experiencias compartidas.",
    images: [`${BASE_URL}/logos/holistia-og.png`],
    siteName: "Holistia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feed | Holistia",
    description: "Publicaciones de la comunidad Holistia",
  },
  alternates: {
    canonical: `${BASE_URL}/feed`,
  },
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
