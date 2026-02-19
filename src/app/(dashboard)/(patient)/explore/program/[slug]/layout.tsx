import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { generateDigitalProductMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("digital_products")
    .select(
      `id, slug, title, description, category, price, currency, cover_image_url, professional_id, sales_count, created_at, updated_at,
      professional_applications!digital_products_professional_id_fkey(first_name, last_name, profession, slug)`
    )
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Programa no encontrado | Holistia" };

  const professional = Array.isArray(data.professional_applications)
    ? data.professional_applications[0]
    : data.professional_applications;

  return generateDigitalProductMetadata({
    id: data.id,
    slug: data.slug ?? undefined,
    title: data.title,
    description: data.description || "",
    category: data.category,
    price: data.price,
    currency: data.currency || "MXN",
    cover_image_url: data.cover_image_url ?? undefined,
    professional_id: data.professional_id,
    sales_count: data.sales_count ?? undefined,
    professional: professional
      ? {
          first_name: professional.first_name,
          last_name: professional.last_name,
          profession: professional.profession,
          slug: professional.slug,
        }
      : undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  });
}

export default function ProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
