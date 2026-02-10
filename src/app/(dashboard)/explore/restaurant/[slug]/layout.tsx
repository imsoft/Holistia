import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { generateRestaurantMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurants")
    .select("name, slug, description, cuisine_type, price_range, address, image_url")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Restaurante no encontrado | Holistia" };

  return generateRestaurantMetadata({
    name: data.name,
    slug: data.slug || slug,
    description: data.description ?? undefined,
    cuisine_type: data.cuisine_type ?? undefined,
    price_range: data.price_range ?? undefined,
    address: data.address ?? undefined,
    image_url: data.image_url ?? undefined,
  });
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
