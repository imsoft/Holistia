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
  Clock,
  DollarSign,
  Monitor,
  MapPin,
  Package,
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
  gallery: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  type: "session" | "program";
  modality: "presencial" | "online" | "both";
  duration: number;
  cost: number;
  address?: string;
  image_url?: string;
  program_duration?: {
    value: number;
    unit: "meses" | "semanas" | "dias" | "horas";
  };
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'gallery' | 'certifications' | 'highlights'>('about');

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
          profession,
          gallery
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
        gallery: data.gallery || [],
      });
      setLoading(false);

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", id)
        .eq("isactive", true)
        .order("created_at", { ascending: false });

      if (servicesError) {
        console.error("Error loading services:", servicesError);
      } else {
        setServices(servicesData || []);
      }

      setLoadingServices(false);
    }

    loadProfessional();
  }, [slug]);

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case "presencial":
        return <MapPin className="w-4 h-4" />;
      case "online":
        return <Monitor className="w-4 h-4" />;
      case "both":
        return (
          <div className="flex gap-1">
            <MapPin className="w-4 h-4" />
            <Monitor className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const getModalityLabel = (modality: string) => {
    switch (modality) {
      case "presencial":
        return "Presencial";
      case "online":
        return "En línea";
      case "both":
        return "Presencial y en línea";
      default:
        return modality;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

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

  const handleBookService = (service: Service) => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para agendar una cita");
      return;
    }
    // Redirigir a la página de agendar cita
    window.location.href = `/patient/${userId}/explore/professional/${professionalId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Profesional no encontrado</p>
          <Link href="/" className="text-primary hover:text-primary/80 mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    professional.experience && `${professional.experience}${professional.experience.toLowerCase().includes('año') ? '' : ' años'} de experiencia profesional`,
    professional.certifications.length > 0 && `${professional.certifications.length} certificación${professional.certifications.length !== 1 ? 'es' : ''} verificada${professional.certifications.length !== 1 ? 's' : ''}`,
    professional.average_rating > 0 && `Calificación de ${professional.average_rating.toFixed(1)} estrellas`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-background">
      <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
        {/* Product */}
        <div className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
          {/* Product image */}
          <div className="lg:col-span-4 lg:row-end-1">
            {professional.profile_photo ? (
              <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
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
              <div className="aspect-4/3 w-full rounded-lg bg-linear-to-br from-primary/10 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-background/50 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-6xl font-bold text-primary">
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
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {professional.first_name} {professional.last_name}
                </h1>

                <h2 id="information-heading" className="sr-only">
                  Información del profesional
                </h2>
                {professional.profession && (
                  <p className="mt-2 text-lg text-muted-foreground">
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
                          professional.average_rating > rating ? "fill-yellow-400 text-yellow-400" : "text-muted",
                          "h-5 w-5 shrink-0"
                        )}
                      />
                    ))}
                    <p className="ml-3 text-sm text-foreground">
                      {professional.average_rating.toFixed(1)} de 5 estrellas
                    </p>
                    <p className="ml-2 text-sm text-muted-foreground">
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
                      className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1"
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
                    className="w-full bg-primary hover:bg-primary text-white"
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
                    className="w-full border-primary text-primary hover:bg-primary/5"
                  >
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-primary hover:bg-primary text-white sm:col-span-2"
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
              <div className="mt-10 border-t border-border pt-10">
                <h3 className="text-sm font-medium text-foreground">Destacados</h3>
                <div className="mt-4">
                  <ul role="list" className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary/30">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="pl-2">
                        <span className="text-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Por qué elegirme */}
            <div className="mt-10 border-t border-border pt-10">
              <h3 className="text-sm font-medium text-foreground">¿Por qué elegirme?</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Profesional verificado y certificado
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Atención personalizada y profesional
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Reserva fácil y flexible
                  </p>
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="mt-10 border-t border-border pt-10">
              <h3 className="text-sm font-medium text-foreground">Compartir perfil</h3>
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
            <div className="border-b border-border">
              <div className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('about')}
                  className={classNames(
                    activeTab === 'about'
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground hover:border-border hover:text-foreground",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Acerca de mí
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={classNames(
                    activeTab === 'services'
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground hover:border-border hover:text-foreground",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Servicios
                </button>
                {professional.gallery && professional.gallery.length > 0 && (
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={classNames(
                      activeTab === 'gallery'
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground hover:border-border hover:text-foreground",
                      "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                    )}
                  >
                    Galería
                  </button>
                )}
                {professional.certifications && professional.certifications.length > 0 && (
                  <button
                    onClick={() => setActiveTab('certifications')}
                    className={classNames(
                      activeTab === 'certifications'
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground hover:border-border hover:text-foreground",
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
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground hover:border-border hover:text-foreground",
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
                <div className="text-sm text-muted-foreground">
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: professional.biography }}
                  />
                </div>
              )}

              {activeTab === 'services' && (
                <div className="space-y-6">
                  {loadingServices ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
                      <Package className="w-12 h-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Sin servicios disponibles
                      </h3>
                      <p className="text-muted-foreground text-center text-sm">
                        Este profesional aún no ha configurado sus servicios
                      </p>
                    </div>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service.id}
                        className="relative overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg transition-all"
                      >
                        {service.image_url && (
                          <div className="aspect-video w-full overflow-hidden">
                            <Image
                              src={service.image_url}
                              alt={service.name}
                              width={800}
                              height={450}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-semibold text-foreground">
                              {service.name}
                            </h3>
                            <Badge variant="outline" className="shrink-0 ml-3">
                              {service.type === "session" ? "Sesión" : "Programa"}
                            </Badge>
                          </div>

                          {service.description && (
                            <div
                              className="text-muted-foreground text-sm mb-4 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: service.description }}
                            />
                          )}

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {getModalityIcon(service.modality)}
                              <span>{getModalityLabel(service.modality)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(service.duration)}</span>
                            </div>

                            {service.address && (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{service.address}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">
                                ${service.cost.toLocaleString('es-MX')}
                              </span>
                            </div>

                            {isAuthenticated ? (
                              <Button
                                onClick={() => handleBookService(service)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Agendar
                              </Button>
                            ) : (
                              <Button
                                asChild
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Link href="/login">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Iniciar sesión para agendar
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'gallery' && professional.gallery && professional.gallery.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-6">Galería</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professional.gallery.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden rounded-lg border border-border hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <Image
                          src={imageUrl}
                          alt={`${professional.first_name} ${professional.last_name} - Imagen ${index + 1}`}
                          width={400}
                          height={400}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'certifications' && professional.certifications && professional.certifications.length > 0 && (
                <div>
                  <h3 className="sr-only">Certificaciones</h3>
                  <ul role="list" className="space-y-4">
                    {professional.certifications.map((cert, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                      >
                        <div className="shrink-0">
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{cert}</p>
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
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Experiencia Profesional</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {professional.experience}{professional.experience.toLowerCase().includes('año') ? '' : ' años'}
                        </p>
                      </div>
                    </div>
                  )}

                  {professional.average_rating > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Excelente Calificación</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
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
                        <h4 className="text-sm font-medium text-foreground">Certificado y Verificado</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
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
                        <h4 className="text-sm font-medium text-foreground">Especialidades</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
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
