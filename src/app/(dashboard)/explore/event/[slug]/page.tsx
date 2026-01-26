import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { EventWorkshop } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  User,
  Car,
  CheckCircle,
  XCircle,
  Share2
} from "lucide-react";

import EventPaymentButton from "@/components/ui/event-payment-button";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { EventQuestionsSection } from "@/components/events/event-questions-section";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CopyUrlButton } from "@/components/ui/copy-url-button";
import { EventFreeRegisterButton } from "@/components/events/event-free-register-button";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Mantener en sync con `next.config.ts` (images.remotePatterns)
const ALLOWED_IMAGE_HOSTNAMES = new Set([
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "ui-avatars.com",
  "raylqjmjdlojgkggvenq.supabase.co",
  "fbchqkbvlnkesyevkwoa.supabase.co",
  "hdwyugqswocsfhzsrdxj.supabase.co",
]);

function isAllowedNextImageSrc(src: string) {
  if (!src) return false;
  // Archivos locales
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && ALLOWED_IMAGE_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}

function getCategoryLabel(category: string) {
  const categories: Record<string, string> = {
    espiritualidad: "Espiritualidad",
    salud_mental: "Salud Mental",
    salud_fisica: "Salud Física",
    alimentacion: "Alimentación",
    social: "Social",
  };
  return categories[category] || category;
}

function getParticipantLevelLabel(level: string) {
  const levels: Record<string, string> = {
    todos: "Todos los niveles",
    principiante: "Principiante",
    medio: "Intermedio",
    avanzado: "Avanzado",
  };
  return levels[level] || level;
}

function extractUuidCandidate(slug: string) {
  const parts = slug.split("--");
  const last = parts[parts.length - 1];
  if (last && UUID_RE.test(last)) return last;
  if (UUID_RE.test(slug)) return slug;
  return null;
}

type ProfessionalMini = {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  profile_photo?: string | null;
  user_id?: string | null;
} | null;

type EventWithProfessional = EventWorkshop & {
  professional_applications?: ProfessionalMini;
};

export default async function EventDetailPage({
  params,
}: {
  // Next 16 puede entregar `params` como Promise en Server Components
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug: slugParam } = await params;
  if (!slugParam) {
    notFound();
  }

  const eventIdFromParam = extractUuidCandidate(slugParam);

  const eventQuery = supabase
    .from("events_workshops")
    .select(
      `
        *,
        professional_applications(
          id,
          first_name,
          last_name,
          profession,
          profile_photo,
          user_id
        )
      `
    )
    .eq("is_active", true);

  const { data: eventData, error: eventError } = eventIdFromParam
    ? await eventQuery.eq("id", eventIdFromParam).maybeSingle()
    : await eventQuery.eq("slug", slugParam).maybeSingle();

  if (eventError) {
    // En producción esto se verá como 404, pero dejamos el log para debug.
    console.error("Error fetching event details (server):", eventError);
  }

  if (!eventData?.id) {
    notFound();
  }

  const event = eventData as unknown as EventWithProfessional;
  const professional = (event.professional_applications || null) as ProfessionalMini;
  const galleryImages = Array.isArray(event.gallery_images) ? event.gallery_images : [];
  const mainImageSrc = (galleryImages[0] || event.image_url || "").toString();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id;
  const isAuthenticated = Boolean(currentUserId);

  let isRegistered = false;
  let hasPayment = false;
  let isAdmin = false;
  const isProfessional = Boolean(
    currentUserId && professional?.user_id && professional.user_id === currentUserId
  );

  if (currentUserId) {
    const [registrationResult, paymentResult, profileResult] = await Promise.allSettled([
      supabase
        .from("event_registrations")
        .select("id, status")
        .eq("event_id", event.id!)
        .eq("user_id", currentUserId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, status")
        .eq("event_id", event.id!)
        .eq("patient_id", currentUserId)
        .eq("status", "succeeded")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("type")
        .eq("id", currentUserId)
        .maybeSingle(),
    ]);

    if (registrationResult.status === "fulfilled" && registrationResult.value.data) {
      isRegistered = true;
    }

    if (paymentResult.status === "fulfilled" && paymentResult.value.data) {
      hasPayment = true;
    }

    if (profileResult.status === "fulfilled") {
      isAdmin = profileResult.value.data?.type === "admin";
    }
  }

  // Preferimos compartir la URL canónica con slug si existe.
  const sharePath = `/explore/event/${event.slug || event.id}`;
  const redirectAfterAuth = encodeURIComponent(sharePath);

  const pageInner = (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href="/" className="inline-block mb-6">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Imagen principal con botón de compartir */}
            {mainImageSrc && (
              <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg">
                {isAllowedNextImageSrc(mainImageSrc) ? (
                  <Image
                    src={mainImageSrc}
                    alt={event.name}
                    width={800}
                    height={400}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: event.image_position || "center center",
                    }}
                    priority
                  />
                ) : (
                  // Fallback para URLs no permitidas por Next/Image (evita error server-side en producción)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainImageSrc}
                    alt={event.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: event.image_position || "center center",
                    }}
                    loading="eager"
                  />
                )}
                <div className="absolute top-4 right-4">
                  <CopyUrlButton
                    variant="secondary"
                    size="sm"
                    urlPath={sharePath}
                    className="shadow-lg"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </CopyUrlButton>
                </div>
              </div>
            )}

            {/* Información del evento */}
            <Card className="py-6 sm:py-8">
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {getCategoryLabel(event.category)}
                  </Badge>
                  <Badge variant={event.is_free ? "default" : "outline"} className="text-xs sm:text-sm">
                    {event.is_free ? "Gratuito" : `$${event.price}`}
                  </Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {event.session_type === 'unique' ? 'Evento único' : 'Evento recurrente'}
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Descripción */}
                {event.description && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Descripción</h3>
                    <div 
                      className="text-sm sm:text-base text-foreground leading-relaxed prose prose-sm sm:prose-base max-w-none prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                )}

                <Separator />

                {/* Detalles del evento */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        {event.end_date && event.event_date !== event.end_date
                          ? `${formatEventDate(event.event_date)} - ${formatEventDate(event.end_date)}`
                          : formatEventDate(event.event_date)
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {event.end_date && event.event_date !== event.end_date ? 'Fechas del evento' : 'Fecha del evento'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        {formatEventTime(event.event_time)}
                        {event.end_time && ` - ${formatEventTime(event.end_time)}`}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Horario</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{event.location}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Ubicación</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{event.max_capacity} personas</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Cupo máximo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{event.duration_hours} horas</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Duración</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        {getParticipantLevelLabel(event.participant_level)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Nivel requerido</p>
                    </div>
                  </div>
                </div>

                {/* Estacionamiento */}
                {event.has_parking && (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">Estacionamiento disponible</p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-300">El lugar cuenta con estacionamiento</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galería de imágenes */}
            {galleryImages.length > 1 && (
              <Card className="py-6 sm:py-8">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Galería de imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryImages.slice(1).map((image, index) => (
                      <div key={index} className="relative">
                        {isAllowedNextImageSrc(image) ? (
                          <Image
                            src={image}
                            alt={`${event.name} - Imagen ${index + 2}`}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={`${event.name} - Imagen ${index + 2}`}
                            className="w-full h-48 object-cover rounded-lg"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - sticky en desktop */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4 sm:space-y-6">
            {/* Información del profesional */}
            {professional && (
              <Card className="py-6 sm:py-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Profesional a cargo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {professional.profile_photo ? (
                      isAllowedNextImageSrc(professional.profile_photo) ? (
                        <Image
                          src={professional.profile_photo}
                          alt={`${professional.first_name} ${professional.last_name}`}
                          width={60}
                          height={60}
                          className="w-15 h-15 rounded-full object-cover aspect-square"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={professional.profile_photo}
                          alt={`${professional.first_name} ${professional.last_name}`}
                          className="w-15 h-15 rounded-full object-cover aspect-square"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="w-15 h-15 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        {professional.first_name} {professional.last_name}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {professional.profession}
                      </p>
                    </div>
                  </div>
                  
                </CardContent>
              </Card>
            )}

            {/* Registro */}
            <Card className="py-6 sm:py-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  {hasPayment ? "Registro confirmado" : "Registro al evento"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {hasPayment ? (
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-green-600">¡Registro confirmado!</p>
                      <p className="text-xs sm:text-sm text-muted-foreground px-2">
                        Tu pago ha sido procesado exitosamente. Recibirás un email de confirmación con todos los detalles del evento.
                      </p>
                    </div>
                  </div>
                ) : isRegistered ? (
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mx-auto">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-base sm:text-lg font-semibold text-yellow-600">Registro pendiente</p>
                      <p className="text-xs sm:text-sm text-muted-foreground px-2">
                        Tu registro está pendiente de pago. Completa el proceso para confirmar tu asistencia.
                      </p>
                      {!event.is_free && (
                        <>
                          <EventPaymentButton
                            eventId={event.id!}
                            serviceAmount={event.price || 0}
                            eventName={event.name}
                            eventDate={event.event_date}
                          />
                          <p className="text-xs text-muted-foreground text-center px-2">
                            Al completar el pago, recibirás un email de confirmación.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : !isAuthenticated ? (
                  <>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {event.is_free ? "Gratuito" : `$${event.price}`}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {event.is_free ? "Evento sin costo" : "Costo por persona"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Link href={`/signup?redirect=${redirectAfterAuth}`}>
                        <Button className="w-full text-sm sm:text-base touch-manipulation" size="lg">
                          Registrarse para participar
                        </Button>
                      </Link>
                      <Link href={`/login?redirect=${redirectAfterAuth}`}>
                        <Button
                          variant="outline"
                          className="w-full text-sm sm:text-base touch-manipulation"
                          size="lg"
                        >
                          Ya tengo cuenta
                        </Button>
                      </Link>
                    </div>

                    <p className="text-xs text-muted-foreground text-center px-2">
                      {event.is_free
                        ? "Regístrate para participar en este evento. Recibirás un email de confirmación con todos los detalles."
                        : "Regístrate para participar en este evento. Serás redirigido a Stripe para completar el pago de forma segura."
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {event.is_free ? "Gratuito" : `$${event.price}`}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {event.is_free ? "Evento sin costo" : "Costo por persona"}
                      </p>
                    </div>

                    {event.is_free ? (
                      <EventFreeRegisterButton />
                    ) : (
                      <EventPaymentButton
                        eventId={event.id!}
                        serviceAmount={event.price || 0}
                        eventName={event.name}
                        eventDate={event.event_date}
                      />
                    )}

                    <p className="text-xs text-muted-foreground text-center px-2">
                      {event.is_free
                        ? "Al registrarte, recibirás un email de confirmación con todos los detalles del evento."
                        : "Al registrarte, serás redirigido a Stripe para completar el pago de forma segura. Recibirás un email de confirmación una vez completado el pago."
                      }
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <EventQuestionsSection
          eventId={event.id || ""}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isProfessional={isProfessional}
        />
      </div>
    </div>
  );

  // Si no está autenticado, mostramos navbar/footer público como antes.
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        {pageInner}
        <Footer />
      </>
    );
  }

  // Si está autenticado, el layout del dashboard se encarga del navbar.
  return pageInner;
}
