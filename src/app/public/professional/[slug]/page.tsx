"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Star,
  Award,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  biography: string | null;
  profile_photo: string | null;
  specializations: string[];
  experience: string | null;
  certifications: string[];
  profession: string;
  average_rating: number;
  total_reviews: number;
}

export default function PublicProfessionalPage({
  params,
}: {
  params: { slug: string };
}) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const slug = params.slug;

  useEffect(() => {
    async function loadProfessional() {
      const supabase = createClient();

      // Verificar si el usuario está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Extraer el ID del slug
      // El slug puede ser solo el UUID o un formato "nombre-apellido--uuid"
      // Los UUIDs tienen formato: 8-4-4-4-12 caracteres hexadecimales
      const uuidMatch = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const id = uuidMatch ? uuidMatch[0] : slug;

      const { data, error } = await supabase
        .from("professional_applications")
        .select(
          `
          id,
          first_name,
          last_name,
          biography,
          profile_photo,
          specializations,
          experience,
          certifications,
          profession
        `
        )
        .eq("id", id)
        .eq("status", "approved")
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error loading professional:", error);
        toast.error("No se pudo cargar la información del profesional");
        setLoading(false);
        return;
      }

      // Obtener calificaciones
      const { data: reviewStats } = await supabase
        .from("review_stats")
        .select("average_rating, total_reviews")
        .eq("professional_id", id)
        .maybeSingle();

      setProfessional({
        ...data,
        average_rating: reviewStats?.average_rating || 0,
        total_reviews: reviewStats?.total_reviews || 0,
      });
      setLoading(false);
    }

    loadProfessional();
  }, [slug]);

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/professional/${slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Profesional no encontrado</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section con imagen de portada */}
      {professional.profile_photo && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <Image
            src={professional.profile_photo}
            alt={`${professional.first_name} ${professional.last_name}`}
            width={5760}
            height={3240}
            className="object-cover w-full h-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg mb-2">
                    {professional.first_name} {professional.last_name}
                  </h1>
                  {professional.profession && (
                    <p className="text-xl text-foreground/90 drop-shadow-lg">
                      {professional.profession}
                    </p>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={handleShare} className="shadow-lg">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información del profesional */}
            <Card className="shadow-lg py-4">
              <CardHeader>
                {(!professional.profile_photo) && (
                  <div className="mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      {professional.first_name} {professional.last_name}
                    </h1>
                    {professional.profession && (
                      <p className="text-xl text-muted-foreground">
                        {professional.profession}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {professional.specializations && professional.specializations.length > 0 && (
                    professional.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {spec}
                      </Badge>
                    ))
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Biografía */}
                {professional.biography && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Acerca de mí</h3>
                    <div
                      className="text-muted-foreground leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: professional.biography }}
                    />
                  </div>
                )}

                <Separator />

                {/* Experiencia y calificación */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {professional.experience && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium">{professional.experience}</p>
                        <p className="text-sm text-muted-foreground">Experiencia</p>
                      </div>
                    </div>
                  )}

                  {professional.average_rating > 0 && (
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          {professional.average_rating.toFixed(1)} ({professional.total_reviews} reseñas)
                        </p>
                        <p className="text-sm text-muted-foreground">Calificación</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certificaciones */}
            {professional.certifications && professional.certifications.length > 0 && (
              <Card className="shadow-lg py-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Award className="w-5 h-5 text-primary" />
                    Certificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {professional.certifications.map((cert, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-8">
            {/* Información de contacto / agendar cita */}
            <Card className="shadow-lg py-4">
              <CardHeader>
                <CardTitle>Agendar una cita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAuthenticated && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Para agendar una cita con este profesional, necesitas iniciar sesión o crear una cuenta
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/signup">Registrarse</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/login">Iniciar sesión</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {isAuthenticated && (
                  <div className="space-y-4">
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/patient/${professional.id}/explore/professional/${slug}`}>
                        Ver perfil completo
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Accede al perfil completo para ver servicios, horarios y agendar una cita
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Especialidades destacadas */}
            {professional.specializations && professional.specializations.length > 0 && (
              <Card className="shadow-lg py-4">
                <CardHeader>
                  <CardTitle className="text-lg">Especialidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {professional.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
