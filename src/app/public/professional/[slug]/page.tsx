"use client";

import { useEffect, useState, use } from "react";
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
  CheckCircle2,
  Calendar,
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfessional() {
      const supabase = createClient();

      // Verificar si el usuario está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserId(user?.id || null);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500">
        <div className="text-center text-white">
          <p className="text-xl font-semibold">Profesional no encontrado</p>
          <Link href="/" className="text-white/90 hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section con gradiente moderno */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Información principal */}
            <div className="md:col-span-2">
              <div className="flex items-start gap-6">
                {/* Foto de perfil */}
                {professional.profile_photo && (
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white/20 flex-shrink-0">
                    <Image
                      src={professional.profile_photo}
                      alt={`${professional.first_name} ${professional.last_name}`}
                      width={160}
                      height={160}
                      className="object-cover w-full h-full"
                      priority
                    />
                  </div>
                )}

                <div className="flex-1 pt-2">
                  <h1 className="text-3xl md:text-5xl font-bold mb-3">
                    {professional.first_name} {professional.last_name}
                  </h1>
                  {professional.profession && (
                    <p className="text-xl md:text-2xl text-white/90 mb-4">
                      {professional.profession}
                    </p>
                  )}

                  {/* Calificación */}
                  {professional.average_rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 backdrop-blur-sm">
                        <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                        <span className="font-semibold text-lg">
                          {professional.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-white/80">
                        ({professional.total_reviews} reseñas)
                      </span>
                    </div>
                  )}

                  {/* Experiencia */}
                  {professional.experience && (
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-white/80" />
                      <span className="text-white/90">{professional.experience} de experiencia</span>
                    </div>
                  )}

                  {/* Especialidades */}
                  {professional.specializations && professional.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {professional.specializations.slice(0, 4).map((spec, index) => (
                        <Badge
                          key={index}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card de acción - Sidebar en hero */}
            <div className="md:col-span-1">
              <Card className="shadow-2xl border-0">
                <CardContent className="p-6 space-y-4">
                  {!isAuthenticated ? (
                    <>
                      <div className="text-center mb-4">
                        <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg mb-2">Agenda tu cita</h3>
                        <p className="text-sm text-muted-foreground">
                          Inicia sesión para agendar
                        </p>
                      </div>
                      <Button asChild size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                        <Link href="/signup">Registrarse</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/login">Iniciar sesión</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg">Reserva tu cita</h3>
                      </div>
                      <Button asChild size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                        <Link href={`/patient/${userId}/explore/professional/${slug}`}>
                          Ver perfil completo
                        </Link>
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Accede para ver servicios y horarios
                      </p>
                    </>
                  )}

                  <Separator />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir perfil
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Acerca de */}
            {professional.biography && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl">Acerca de mí</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="text-muted-foreground leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: professional.biography }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Certificaciones */}
            {professional.certifications && professional.certifications.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Award className="w-6 h-6 text-purple-600" />
                    Certificaciones y Formación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {professional.certifications.map((cert, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg bg-purple-50/50 hover:bg-purple-50 transition-colors border border-purple-100"
                      >
                        <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground font-medium">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Destacados */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Puntos Destacados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {professional.experience && (
                    <li className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Experiencia Profesional</h4>
                        <p className="text-muted-foreground">{professional.experience}</p>
                      </div>
                    </li>
                  )}

                  {professional.average_rating > 0 && (
                    <li className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Excelente Calificación</h4>
                        <p className="text-muted-foreground">
                          {professional.average_rating.toFixed(1)} estrellas basado en {professional.total_reviews} reseñas
                        </p>
                      </div>
                    </li>
                  )}

                  {professional.certifications && professional.certifications.length > 0 && (
                    <li className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Certificado y Verificado</h4>
                        <p className="text-muted-foreground">
                          {professional.certifications.length} certificación{professional.certifications.length !== 1 ? 'es' : ''} profesional{professional.certifications.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Especialidades */}
            {professional.specializations && professional.specializations.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Especialidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {professional.specializations.map((spec, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info adicional */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">¿Por qué elegirme?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Profesional verificado y certificado
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Atención personalizada y profesional
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Reserva fácil y flexible
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
