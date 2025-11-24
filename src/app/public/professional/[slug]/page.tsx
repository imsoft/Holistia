"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  MapPin,
  Star,
  Award,
  Calendar,
  Share2,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar_url: string | null;
  specializations: string[];
  years_of_experience: number | null;
  certifications: string[];
  consultation_price: number | null;
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
        .from("profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          bio,
          avatar_url,
          specializations,
          years_of_experience,
          certifications,
          consultation_price
        `
        )
        .eq("id", id)
        .eq("type", "professional")
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
      if (navigator.share) {
        await navigator.share({
          title: `${professional?.first_name} ${professional?.last_name} - Holistia`,
          text: `Conoce a ${professional?.first_name} ${professional?.last_name} en Holistia`,
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      try {
        await navigator.clipboard.writeText(publicUrl);
        toast.success("Enlace copiado al portapapeles");
      } catch (clipboardError) {
        toast.error("No se pudo copiar el enlace");
      }
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
      {/* Header con botones */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-primary hover:underline">
              ← Volver
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>
              {!isAuthenticated && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar sesión
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Perfil del profesional */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 relative rounded-full overflow-hidden flex-shrink-0 bg-muted">
                {professional.avatar_url ? (
                  <Image
                    src={professional.avatar_url}
                    alt={`${professional.first_name} ${professional.last_name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                    {professional.first_name[0]}
                    {professional.last_name[0]}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {professional.first_name} {professional.last_name}
                </h1>

                {professional.specializations &&
                  professional.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {professional.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {professional.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">
                        {professional.average_rating.toFixed(1)}
                      </span>
                      <span>({professional.total_reviews} reseñas)</span>
                    </div>
                  )}

                  {professional.years_of_experience && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{professional.years_of_experience} años de experiencia</span>
                    </div>
                  )}
                </div>

                {professional.bio && (
                  <p className="text-muted-foreground mb-4">{professional.bio}</p>
                )}

                {professional.consultation_price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Precio de consulta:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ${professional.consultation_price.toFixed(2)} MXN
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificaciones */}
        {professional.certifications && professional.certifications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {professional.certifications.map((cert, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Call to action para usuarios no autenticados */}
        {!isAuthenticated && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">
                ¿Quieres agendar una cita con este profesional?
              </h3>
              <p className="text-muted-foreground mb-4">
                Regístrate o inicia sesión para ver más información y agendar una cita
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/signup">Registrarse</Link>
                </Button>
                <Button asChild variant="outline">
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
