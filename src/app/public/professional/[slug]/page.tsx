"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Star,
  Award,
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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
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
  const [professionalId, setProfessionalId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'about' | 'certifications' | 'highlights'>('about');

  useEffect(() => {
    async function loadProfessional() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserId(user?.id || null);

      const uuidMatch = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const id = uuidMatch ? uuidMatch[0] : slug;
      setProfessionalId(id);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900">Profesional no encontrado</p>
          <Link href="/" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    professional.experience && `${professional.experience} de experiencia profesional`,
    professional.certifications.length > 0 && `${professional.certifications.length} certificación${professional.certifications.length !== 1 ? 'es' : ''} verificada${professional.certifications.length !== 1 ? 's' : ''}`,
    professional.average_rating > 0 && `Calificación de ${professional.average_rating.toFixed(1)} estrellas`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white">
      <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
        {/* Product */}
        <div className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
          {/* Product image */}
          <div className="lg:col-span-4 lg:row-end-1">
            {professional.profile_photo ? (
              <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  alt={`${professional.first_name} ${professional.last_name}`}
                  src={professional.profile_photo}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover object-center"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-4/3 w-full rounded-lg bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-white/50 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-6xl font-bold text-purple-600">
                      {professional.first_name[0]}{professional.last_name[0]}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="mx-auto mt-14 max-w-2xl sm:mt-16 lg:col-span-3 lg:row-span-2 lg:row-end-2 lg:mt-0 lg:max-w-none">
            <div className="flex flex-col-reverse">
              <div className="mt-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {professional.first_name} {professional.last_name}
                </h1>

                <h2 id="information-heading" className="sr-only">
                  Información del profesional
                </h2>
                {professional.profession && (
                  <p className="mt-2 text-lg text-gray-500">
                    {professional.profession}
                  </p>
                )}
              </div>

              <div>
                <h3 className="sr-only">Reseñas</h3>
                {professional.average_rating > 0 && (
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <Star
                        key={rating}
                        aria-hidden="true"
                        className={classNames(
                          professional.average_rating > rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                          "h-5 w-5 shrink-0"
                        )}
                      />
                    ))}
                    <p className="ml-3 text-sm text-gray-700">
                      {professional.average_rating.toFixed(1)} de 5 estrellas
                    </p>
                    <p className="ml-2 text-sm text-gray-500">
                      ({professional.total_reviews} reseñas)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Especialidades */}
            {professional.specializations && professional.specializations.length > 0 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {professional.specializations.map((spec, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Link href="/signup">
                      <Calendar className="w-5 h-5 mr-2" />
                      Registrarse
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white sm:col-span-2"
                  >
                    <Link href={`/patient/${userId}/explore/professional/${professionalId}`}>
                      <Calendar className="w-5 h-5 mr-2" />
                      Agendar Cita
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h3 className="text-sm font-medium text-gray-900">Destacados</h3>
                <div className="mt-4">
                  <ul role="list" className="list-disc space-y-2 pl-5 text-sm text-gray-500 marker:text-purple-300">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="pl-2">
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Por qué elegirme */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-gray-900">¿Por qué elegirme?</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500">
                    Profesional verificado y certificado
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500">
                    Atención personalizada y profesional
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500">
                    Reserva fácil y flexible
                  </p>
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-gray-900">Compartir perfil</h3>
              <div className="mt-4">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Copiar enlace
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs section */}
          <div className="mx-auto mt-16 w-full max-w-2xl lg:col-span-4 lg:mt-0 lg:max-w-none">
            <div className="border-b border-gray-200">
              <div className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('about')}
                  className={classNames(
                    activeTab === 'about'
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Acerca de mí
                </button>
                {professional.certifications && professional.certifications.length > 0 && (
                  <button
                    onClick={() => setActiveTab('certifications')}
                    className={classNames(
                      activeTab === 'certifications'
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800",
                      "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                    )}
                  >
                    Certificaciones
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('highlights')}
                  className={classNames(
                    activeTab === 'highlights'
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Información
                </button>
              </div>
            </div>

            {/* Tab panels */}
            <div className="mt-10">
              {activeTab === 'about' && professional.biography && (
                <div className="text-sm text-gray-500">
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-500 prose-a:text-purple-600 prose-strong:text-gray-900"
                    dangerouslySetInnerHTML={{ __html: professional.biography }}
                  />
                </div>
              )}

              {activeTab === 'certifications' && professional.certifications && professional.certifications.length > 0 && (
                <div>
                  <h3 className="sr-only">Certificaciones</h3>
                  <ul role="list" className="space-y-4">
                    {professional.certifications.map((cert, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="shrink-0">
                          <Award className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cert}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'highlights' && (
                <div className="space-y-6">
                  {professional.experience && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Experiencia Profesional</h4>
                        <p className="mt-1 text-sm text-gray-500">{professional.experience}</p>
                      </div>
                    </div>
                  )}

                  {professional.average_rating > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Excelente Calificación</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {professional.average_rating.toFixed(1)} estrellas basado en {professional.total_reviews} reseñas
                        </p>
                      </div>
                    </div>
                  )}

                  {professional.certifications && professional.certifications.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Certificado y Verificado</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {professional.certifications.length} certificación{professional.certifications.length !== 1 ? 'es' : ''} profesional{professional.certifications.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {professional.specializations && professional.specializations.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Especialidades</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {professional.specializations.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
