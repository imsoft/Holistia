import { Metadata } from "next";
import { BASE_URL } from "@/lib/seo";
import { getPublicPostMeta } from "@/lib/feed-post-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const url = `${BASE_URL}/feed/post/${id}`;

  // Solo posts públicos: la vista social_feed_checkins ya filtra is_public = true
  const meta = await getPublicPostMeta(id);

  if (!meta) {
    return {
      title: "Publicación | Holistia",
      description: "Publicación de la comunidad en Holistia",
      openGraph: {
        type: "article",
        url,
        title: "Publicación | Holistia",
        description: "Publicación de la comunidad en Holistia",
        images: [`${BASE_URL}/logos/holistia-og.png`],
        siteName: "Holistia",
      },
      twitter: {
        card: "summary_large_image",
        title: "Publicación | Holistia",
        description: "Publicación de la comunidad en Holistia",
      },
      alternates: { canonical: url },
      robots: { index: false, follow: true },
    };
  }

  const ogImage = meta.image || `${BASE_URL}/logos/holistia-og.png`;

  return {
    title: `${meta.title} | Holistia`,
    description: meta.description,
    openGraph: {
      type: "article",
      url,
      title: `${meta.title} | Holistia`,
      description: meta.description,
      images: [ogImage],
      siteName: "Holistia",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | Holistia`,
      description: meta.description,
      images: [ogImage],
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
