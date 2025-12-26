import { Metadata } from "next";
import { createAnonClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";

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
  slug: string | null;
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

  return {
    title: `${profession} en Holistia | Encuentra tu Experto`,
    description: `Encuentra los mejores profesionales de ${profession} en México. Consultas presenciales y en línea. Reserva tu cita hoy.`,
    keywords: [
      profession,
      `${profession} México`,
      `consultas de ${profession}`,
      `expertos en ${profession}`,
      "bienestar",
      "salud integral",
    ],
    openGraph: {
      title: `${profession} en Holistia`,
      description: `Encuentra los mejores profesionales de ${profession} en México`,
      type: "website",
    },
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
      state,
      slug
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

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Botón de regresar */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Profesionales de{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              {profession}
            </span>
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
              <Card
                key={professional.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-0">
                  {/* Imagen del profesional */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-purple-500/10">
                    {professional.profile_photo ? (
                      <Image
                        src={professional.profile_photo}
                        alt={`${professional.first_name} ${professional.last_name}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary">
                            {professional.first_name[0]}
                            {professional.last_name[0]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="p-6">
                    {/* Nombre y profesión */}
                    <h3 className="text-xl font-bold mb-1">
                      {professional.first_name} {professional.last_name}
                    </h3>
                    <Badge variant="secondary" className="mb-3">
                      {professional.profession}
                    </Badge>

                    {/* Ubicación */}
                    {(professional.city || professional.state) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {[professional.city, professional.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Biografía */}
                    {professional.biography && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {professional.biography}
                      </p>
                    )}

                    {/* Botón de ver perfil */}
                    <Link
                      href={
                        professional.slug
                          ? `/public/professional/${professional.slug}`
                          : `/explore/professional/${professional.id}`
                      }
                    >
                      <Button className="w-full gap-2">
                        <Calendar className="h-4 w-4" />
                        Ver perfil y agendar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
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
