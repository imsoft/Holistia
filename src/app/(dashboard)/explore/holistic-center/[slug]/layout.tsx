import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { generateHolisticCenterMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("holistic_centers")
    .select("name, slug, description, city, address, image_url")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Centro holístico no encontrado | Holistia" };

  return generateHolisticCenterMetadata({
    name: data.name,
    slug: data.slug || slug,
    description: data.description ?? undefined,
    city: data.city ?? undefined,
    address: data.address ?? undefined,
    image_url: data.image_url ?? undefined,
  });
}

export default function HolisticCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
