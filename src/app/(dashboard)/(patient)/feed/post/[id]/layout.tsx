import { Metadata } from "next";
import { BASE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const url = `${BASE_URL}/feed/post/${id}`;

  return {
    title: `Publicación | Holistia`,
    description: "Mira el progreso en este reto de bienestar en Holistia",
    openGraph: {
      type: "article",
      url,
      title: "Publicación en Holistia - Progreso en reto de bienestar",
      description: "Descubre el progreso en este reto de bienestar. Únete a la comunidad Holistia.",
      images: [`${BASE_URL}/logos/holistia-og.png`],
      siteName: "Holistia",
    },
    twitter: {
      card: "summary_large_image",
      title: "Publicación en Holistia",
      description: "Progreso en reto de bienestar",
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function FeedPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
