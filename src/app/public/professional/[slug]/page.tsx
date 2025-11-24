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

      // Extraer el ID del slug (formato: nombre-apellido-id)
      const parts = slug.split("-");
      const id = parts[parts.length - 1];

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
      {/* Hero Section con avatar */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full overflow-hidden flex-shrink-0 bg-muted border-4 border-background shadow-lg">
              {professional.profile_photo ? (
                <Image
                  src={professional.profile_photo}
                  alt={`${professional.first_name} ${professional.last_name}`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-bold text-primary">
                  {professional.first_name[0]}
                  {professional.last_name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                {professional.first_name} {professional.last_name}
              </h1>
              {professional.specializations && professional.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {professional.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                {professional.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {professional.average_rating.toFixed(1)}
                    </span>
                    <span>({professional.total_reviews} reseñas)</span>
                  </div>
                )}
                {professional.experience && (
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-primary" />
                    <span>{professional.experience} de experiencia</span>
                  </div>
                )}
                {professional.profession && (
                  <Badge variant="outline" className="text-sm">
                    {professional.profession}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleShare} className="shadow-lg">
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Información del profesional */}
        {professional.biography && (
          <Card className="mb-8 shadow-lg">
            <CardContent className="pt-6">
              <div
                className="text-muted-foreground prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: professional.biography }}
              />
            </CardContent>
          </Card>
        )}

        {/* Certificaciones */}
        {professional.certifications && professional.certifications.length > 0 && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Award className="w-5 h-5 text-primary" />
                Certificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {professional.certifications.map((cert, index) => (
                  <li key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{cert}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Call to action para usuarios no autenticados */}
        {!isAuthenticated && (
          <Card className="bg-primary/5 border-primary/20 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <h3 className="text-2xl font-semibold mb-3 text-foreground">
                ¿Quieres agendar una cita con este profesional?
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Regístrate o inicia sesión para ver más información y agendar una cita
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-base">
                  <Link href="/signup">Registrarse</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
