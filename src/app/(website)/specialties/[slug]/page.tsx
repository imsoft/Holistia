import { Metadata } from "next";
import { createAnonClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { BASE_URL } from "@/lib/seo";

interface SpecialtyPageProps {
  params: Promise<{ slug: string }>;
}

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  profession: string;
  biography: string | null;
  profile_photo: string | null;
  city: string | null;
  state: string | null;
}

// Función para normalizar texto (quitar acentos, convertir a minúsculas)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Función para convertir slug a profession (aproximación)
function slugToProfession(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Generar metadata
export async function generateMetadata({
  params,
}: SpecialtyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profession = slugToProfession(slug);

  const title = `${profession} en Holistia | Encuentra tu Experto`;
  const description = `Encuentra los mejores profesionales de ${profession} en México. Consultas presenciales y en línea. Reserva tu cita hoy.`;
  const url = `${BASE_URL}/specialties/${slug}`;
  const imageUrl = `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      profession,
      `${profession} México`,
      `consultas de ${profession}`,
      `expertos en ${profession}`,
      "bienestar",
      "salud integral",
      "consultas online",
      "consultas presenciales",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Holistia",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

export default async function SpecialtyPage({ params }: SpecialtyPageProps) {
  const { slug } = await params;
  const supabase = createAnonClient();

  // Normalizar el slug para comparación
  const normalizedSlug = normalizeText(slug);

  // Obtener todos los profesionales aprobados y activos
  const { data: allProfessionals, error: fetchError } = await supabase
    .from("professional_applications")
    .select(
      `
      id,
      user_id,
      first_name,
      last_name,
      profession,
      biography,
      profile_photo,
      city,
      state
    `
    )
    .eq("status", "approved")
    .eq("is_active", true);

  if (fetchError) {
    console.error("❌ Error fetching professionals:", fetchError);
    notFound();
  }

  if (!allProfessionals || allProfessionals.length === 0) {
    console.error("❌ No professionals found");
    notFound();
  }

  // Filtrar profesionales cuyo profession normalizado coincida con el slug
  const professionals: Professional[] = allProfessionals.filter((prof) => {
    if (!prof.profession) return false;
    const normalizedProfession = normalizeText(prof.profession);
    return normalizedProfession === normalizedSlug;
  });

  if (professionals.length === 0) {
    console.error(`❌ No professionals found for specialty: ${slug}`);
    notFound();
  }

  // Ordenar por nombre
  professionals.sort((a, b) => a.first_name.localeCompare(b.first_name));

  // Obtener el nombre de la profesión desde el primer profesional encontrado
  const profession = professionals[0].profession;

  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Profesionales de ${profession}`,
    description: `Encuentra los mejores profesionales de ${profession} en México. Consultas presenciales y en línea.`,
    url: `${BASE_URL}/specialties/${slug}`,
    numberOfItems: professionals.length,
    provider: {
      "@type": "Organization",
      name: "Holistia",
      url: BASE_URL,
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Profesionales de {profession}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Encuentra al experto ideal para tus necesidades. {professionals.length}{" "}
            {professionals.length === 1 ? "profesional disponible" : "profesionales disponibles"}.
          </p>
        </div>
      </section>

      {/* Profesionales Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={{
                  id: professional.id,
                  name: `${professional.first_name} ${professional.last_name}`,
                  first_name: professional.first_name,
                  last_name: professional.last_name,
                  email: "",
                  profession: professional.profession,
                  profile_photo: professional.profile_photo || undefined,
                  avatar: professional.profile_photo || undefined,
                  city: professional.city || undefined,
                  state: professional.state || undefined,
                  bio: professional.biography || undefined,
                  biography: professional.biography || undefined,
                }}
              />
            ))}
          </div>

          {/* CTA final */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              ¿No encontraste lo que buscabas?
            </p>
            <Link href="/explore">
              <Button variant="outline" size="lg">
                Explorar todas las especialidades
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
