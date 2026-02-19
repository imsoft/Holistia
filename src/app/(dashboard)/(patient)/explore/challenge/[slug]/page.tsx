import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { generateChallengeMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Check,
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { JoinChallengeButton } from "@/components/ui/join-challenge-button";

interface ChallengePageProps {
  params: Promise<{ slug: string }>;
}

const difficultyLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  expert: "Experto",
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-orange-100 text-orange-800",
  expert: "bg-red-100 text-red-800",
};

// Helper function para obtener profesional por separado (evita problemas de RLS en joins)
async function getProfessionalData(supabase: any, professionalId: string | null) {
  if (!professionalId) return null;
  
  const { data: professional } = await supabase
    .from("professional_applications")
    .select("id, slug, first_name, last_name, profile_photo, profession, is_verified")
    .eq("id", professionalId)
    .maybeSingle();
  
  return professional;
}

// Helper function para buscar challenge por slug o ID
async function findChallenge(supabase: any, slugParam: string, userId?: string | null) {
  // Estrategia: obtener el reto SIN join primero para evitar problemas de RLS
  // Luego obtener el profesional por separado si existe
  
  console.log("🔍 [findChallenge] Iniciando búsqueda:", {
    slug: slugParam,
    userId: userId || "anon",
    timestamp: new Date().toISOString(),
  });
  
  // 1. Buscar reto público/activo por slug
  let { data: challenge, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true)
    .eq("slug", slugParam)
    .maybeSingle();
  
  // Log para debugging
  if (error) {
    console.log("🔍 [findChallenge] Error buscando por slug:", {
      slug: slugParam,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  } else if (!challenge) {
    console.log("🔍 [findChallenge] No se encontró reto por slug (público/activo):", slugParam);
    
    // Intentar buscar sin filtros para ver si el reto existe pero no es público/activo
    const { data: anyChallenge } = await supabase
      .from("challenges")
      .select("id, slug, is_active, is_public")
      .eq("slug", slugParam)
      .maybeSingle();
    
    if (anyChallenge) {
      console.log("⚠️ [findChallenge] Reto existe pero no cumple filtros:", {
        id: anyChallenge.id,
        slug: anyChallenge.slug,
        is_active: anyChallenge.is_active,
        is_public: anyChallenge.is_public,
      });
    } else {
      console.log("❌ [findChallenge] Reto no existe con slug:", slugParam);
    }
  } else {
    console.log("✅ [findChallenge] Reto encontrado por slug:", {
      id: challenge.id,
      slug: challenge.slug,
      is_public: challenge.is_public,
      is_active: challenge.is_active,
    });
  }

  // 2. Si no encuentra por slug, intentar por ID (compatibilidad hacia atrás)
  if (error || !challenge) {
    const { data: dataById, error: errorById } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true)
      .eq("id", slugParam)
      .maybeSingle();

    if (!errorById && dataById) {
      challenge = dataById;
      error = null;
    }
  }

  // 3. Si no se encontró como público/activo pero hay usuario autenticado,
  // verificar si es dueño o participante del reto (puede ser privado o inactivo)
  if ((error || !challenge) && userId) {
    // Buscar por slug sin filtros de público/activo
    let { data: privateChallenge, error: privateError } = await supabase
      .from("challenges")
      .select("*")
      .eq("slug", slugParam)
      .maybeSingle();

    // Si no encuentra por slug, intentar por ID
    if (privateError || !privateChallenge) {
      const { data: dataById, error: errorById } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", slugParam)
        .maybeSingle();

      if (!errorById && dataById) {
        privateChallenge = dataById;
        privateError = null;
      }
    }

    // Si encontramos el reto, verificar si el usuario tiene acceso
    if (privateChallenge && !privateError) {
      // Verificar si es el creador del reto
      const isCreator = privateChallenge.created_by_user_id === userId;

      // Verificar si es participante
      let isParticipant = false;
      if (!isCreator) {
        const { data: participation } = await supabase
          .from("challenge_purchases")
          .select("id")
          .eq("challenge_id", privateChallenge.id)
          .eq("participant_id", userId)
          .maybeSingle();

        isParticipant = !!participation;
      }

      // Si es creador o participante, mostrar el reto
      if (isCreator || isParticipant) {
        challenge = privateChallenge;
        error = null;
      }
    }
  }

  // 4. Si encontramos el reto, obtener el profesional por separado
  if (challenge && !error) {
    const professional = await getProfessionalData(supabase, challenge.professional_id);
    if (professional) {
      challenge.professional_applications = professional;
      console.log("✅ [findChallenge] Profesional obtenido:", professional.id);
    } else if (challenge.professional_id) {
      console.log("⚠️ [findChallenge] No se pudo obtener profesional:", challenge.professional_id);
    }
  }

  // Log final
  if (error || !challenge) {
    console.log("❌ [findChallenge] Resultado final: NO ENCONTRADO", {
      slug: slugParam,
      userId: userId || "anon",
      error: error?.message || "No encontrado",
    });
  }

  return { challenge, error };
}

export async function generateMetadata({
  params,
}: ChallengePageProps): Promise<Metadata> {
  const { slug: slugParam } = await params;
  const supabase = await createClient();

  // Obtener usuario autenticado (si existe)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  const { challenge } = await findChallenge(supabase, slugParam, userId);

  if (!challenge) {
    return {
      title: "Reto no encontrado | Holistia",
    };
  }

  return generateChallengeMetadata({
    title: challenge.title,
    description: challenge.short_description || challenge.description || "",
    category: challenge.category || "Bienestar",
    difficulty: challenge.difficulty_level || "beginner",
    durationDays: challenge.duration_days || 30,
    coverImage: challenge.cover_image_url || undefined,
    slug: challenge.slug || slugParam,
    creatorName: undefined,
  });
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { slug: slugParam } = await params;
  const supabase = await createClient();

  // Obtener usuario autenticado (si existe)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // Obtener información del reto
  const { challenge, error } = await findChallenge(supabase, slugParam, userId);

  if (error || !challenge) {
    // Log detallado del error para debugging
    console.error("❌ Error fetching challenge:", {
      slug: slugParam,
      error: error?.message || error,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorHint: error?.hint,
      userId: userId || "anon",
      timestamp: new Date().toISOString(),
    });
    
    // Si es un error de RLS (permission denied), dar más información
    if (error?.code === '42501' || error?.message?.includes('permission denied')) {
      console.error("🔒 RLS Policy Error: El usuario no tiene permisos para ver este reto");
    }
    
    notFound();
  }

  // Log de éxito para debugging
  console.log("✅ Challenge found:", {
    id: challenge.id,
    slug: challenge.slug,
    is_public: challenge.is_public,
    is_active: challenge.is_active,
    hasProfessional: !!challenge.professional_applications,
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal - Información del reto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagen principal */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
              <Image
                src={
                  challenge.cover_image_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(challenge.title)}&background=random&size=800`
                }
                alt={challenge.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 right-4">
                <FavoriteButton
                  itemId={challenge.id}
                  favoriteType="challenge"
                  variant="floating"
                />
              </div>
              {challenge.difficulty_level && (
                <div className="absolute top-4 left-4">
                  <Badge
                    className={`${difficultyColors[challenge.difficulty_level as keyof typeof difficultyColors]} text-sm px-3 py-1`}
                  >
                    {difficultyLabels[challenge.difficulty_level as keyof typeof difficultyLabels]}
                  </Badge>
                </div>
              )}
            </div>

            {/* Título y categoría */}
            <div>
              <h1 className="text-4xl font-bold mb-3">{challenge.title}</h1>
              {challenge.category && (
                <Badge variant="secondary" className="mb-4">
                  {challenge.category}
                </Badge>
              )}
              {challenge.short_description && (
                <p className="text-lg text-muted-foreground">
                  {challenge.short_description}
                </p>
              )}
            </div>

            <Separator />

            {/* Descripción completa */}
            {challenge.description && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Sobre este reto
                </h2>
                <div
                  className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-semibold prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ 
                    __html: challenge.description.replace(/\n/g, '<br />')
                  }}
                />
              </div>
            )}

            <Separator />

            {/* Información del profesional creador */}
            {challenge.professional_applications && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Creado por
                </h2>
                <Link
                  href={`/explore/professional/${challenge.professional_applications.slug}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  {challenge.professional_applications.profile_photo ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden">
                      <Image
                        src={challenge.professional_applications.profile_photo}
                        alt={`${challenge.professional_applications.first_name} ${challenge.professional_applications.last_name}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">
                        {challenge.professional_applications.first_name}{" "}
                        {challenge.professional_applications.last_name}
                      </p>
                      {challenge.professional_applications.is_verified && (
                        <VerifiedBadge size={18} />
                      )}
                    </div>
                    {challenge.professional_applications.profession && (
                      <p className="text-sm text-muted-foreground">
                        {challenge.professional_applications.profession}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar - Tarjeta de unirse */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                {/* Detalles del reto */}
                <div className="space-y-3">
                  {challenge.duration_days && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Duración</p>
                        <p className="text-sm text-muted-foreground">
                          {challenge.duration_days}{" "}
                          {challenge.duration_days === 1 ? "día" : "días"}
                        </p>
                      </div>
                    </div>
                  )}

                  {challenge.difficulty_level && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nivel</p>
                        <p className="text-sm text-muted-foreground">
                          {difficultyLabels[challenge.difficulty_level as keyof typeof difficultyLabels]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Botón de unirse */}
                <JoinChallengeButton
                  challengeId={challenge.id}
                  challengeSlug={challenge.slug}
                  userId={userId || ""}
                  challengePrice={challenge.price}
                />

                {/* Beneficios */}
                <div className="space-y-2 pt-4">
                  <p className="text-sm font-medium">Incluye:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Acceso completo al reto</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Soporte del profesional</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Material descargable</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Seguimiento de progreso</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
