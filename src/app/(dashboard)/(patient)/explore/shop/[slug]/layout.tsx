import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { generateShopMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("shops")
    .select("name, slug, description, category, city, image_url")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Comercio no encontrado | Holistia" };

  return generateShopMetadata({
    name: data.name,
    slug: data.slug || slug,
    description: data.description ?? undefined,
    category: data.category ?? undefined,
    city: data.city ?? undefined,
    image_url: data.image_url ?? undefined,
  });
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
