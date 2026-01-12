import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Check,
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { JoinChallengeButton } from "@/components/ui/join-challenge-button";

interface ChallengePageProps {
  params: Promise<{ id: string; challengeId: string }>;
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

export async function generateMetadata({
  params,
}: ChallengePageProps): Promise<Metadata> {
  const { challengeId } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge) {
    return {
      title: "Reto no encontrado",
    };
  }

  return {
    title: `${challenge.title} | Holistia`,
    description: challenge.short_description || challenge.description,
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id: userId, challengeId } = await params;
  const supabase = await createClient();

  // Obtener información del reto
  const { data: challenge, error } = await supabase
    .from("challenges")
    .select(`
      *,
      professional_applications(
        id,
        first_name,
        last_name,
        profile_photo,
        profession,
        is_verified
      )
    `)
    .eq("id", challengeId)
    .single();

  if (error || !challenge) {
    console.error("Error fetching challenge:", error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Botón de regresar */}
        <Link
          href={`/patient/${userId}/explore`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a explorar
        </Link>

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
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: challenge.description }}
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
                <div className="flex items-center gap-4">
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
                </div>
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
                  userId={userId || undefined}
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
