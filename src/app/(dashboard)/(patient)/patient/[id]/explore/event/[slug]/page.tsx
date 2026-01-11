"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { EventWorkshop } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import Image from "next/image";
import { toast } from "sonner";
import EventPaymentButton from "@/components/ui/event-payment-button";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { EventQuestionsSection } from "@/components/events/event-questions-section";

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const slug = params.slug as string;
  
  const [event, setEvent] = useState<EventWorkshop | null>(null);
  const [professional, setProfessional] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    profession: string;
    profile_photo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasPayment, setHasPayment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  
  const supabase = createClient();

  // Extraer ID del evento del slug
  // El slug tiene formato: "nombre-del-evento--uuid-del-evento"
  // Usar regex para extraer el UUID (formato: 8-4-4-4-12 caracteres hexadecimales)
  const uuidMatch = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const eventId = uuidMatch ? uuidMatch[0] : slug;

  const fetchEventDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener detalles del evento
      const { data: eventData, error: eventError } = await supabase
        .from("events_workshops")
        .select("*")
        .eq("id", eventId)
        .eq("is_active", true)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Si hay un profesional asignado, obtener sus datos
      if (eventData?.professional_id) {
        const { data: professionalData, error: professionalError } = await supabase
          .from("professional_applications")
          .select("id, first_name, last_name, profession, profile_photo")
          .eq("id", eventData.professional_id)
          .eq("status", "approved")
          .single();

        if (!professionalError && professionalData) {
          setProfessional(professionalData);
        }
      }

      // Verificar si el usuario ya está registrado
      const { data: registration } = await supabase
        .from("event_registrations")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

      if (registration) {
        setIsRegistered(true);
        
        // Verificar si ya tiene un pago exitoso
        const { data: payment } = await supabase
          .from("payments")
          .select("id, status")
          .eq("event_id", eventId)
          .eq("patient_id", userId)
          .eq("status", "succeeded")
          .single();

        if (payment) {
          setHasPayment(true);
        }
      }

      // Verificar si el usuario es admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("type")
        .eq("id", userId)
        .single();

      setIsAdmin(profile?.type === "admin");

      // Verificar si el usuario es el profesional del evento
      if (eventData?.professional_id) {
        const { data: professionalApp } = await supabase
          .from("professional_applications")
          .select("user_id")
          .eq("id", eventData.professional_id)
          .eq("user_id", userId)
          .eq("status", "approved")
          .single();

        setIsProfessional(!!professionalApp);
      }

      // Obtener ID del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Error al cargar los detalles del evento");
    } finally {
      setLoading(false);
    }
  }, [supabase, eventId, userId]);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, fetchEventDetails]);

  const handleRegister = async () => {
    if (!event) return;
    
    try {
      setRegistering(true);
      
      // Aquí implementarías la lógica de registro
      // Por ahora solo mostramos un mensaje
      toast.success("¡Registro exitoso! Te hemos enviado un email de confirmación.");
      
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("Error al registrarse en el evento");
    } finally {
      setRegistering(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      espiritualidad: "Espiritualidad",
      salud_mental: "Salud Mental",
      salud_fisica: "Salud Física",
      alimentacion: "Alimentación",
      social: "Social"
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getParticipantLevelLabel = (level: string) => {
    const levels = {
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      all: "Todos los niveles"
    };
    return levels[level as keyof typeof levels] || level;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/public/event/${eventId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Skeleton className="w-full h-64 md:h-80 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center py-12 px-4">
            <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Evento no encontrado</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
              El evento que buscas no existe o ya no está disponible.
            </p>
            <Button onClick={() => router.back()} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Imagen principal con botón de compartir */}
            {(event.gallery_images?.[0] || event.image_url) && (
              <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg">
                <Image
                  src={event.gallery_images?.[0] || event.image_url || ""}
                  alt={event.name}
                  width={800}
                  height={400}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: event.image_position || 'center center'
                  }}
                  priority
                />
                <div className="absolute top-4 right-4">
                  <Button variant="secondary" size="sm" onClick={handleShare} className="shadow-lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
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
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
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
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        {formatEventTime(event.event_time)}
                        {event.end_time && ` - ${formatEventTime(event.end_time)}`}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Horario</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{event.location}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Ubicación</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{event.max_capacity} personas</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Cupo máximo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{event.duration_hours} horas</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Duración</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">{getParticipantLevelLabel(event.participant_level)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Nivel requerido</p>
                    </div>
                  </div>
                </div>

                {/* Estacionamiento */}
                {event.has_parking && (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">Estacionamiento disponible</p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-300">El lugar cuenta con estacionamiento</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galería de imágenes */}
            {event.gallery_images && event.gallery_images.length > 1 && (
              <Card className="py-6 sm:py-8">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Galería de imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {event.gallery_images.slice(1).map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image}
                          alt={`${event.name} - Imagen ${index + 2}`}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg"
                        />
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
                      <Image
                        src={professional.profile_photo}
                        alt={`${professional.first_name} ${professional.last_name}`}
                        width={60}
                        height={60}
                        className="w-15 h-15 rounded-full object-cover aspect-square"
                      />
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
                            onError={(error) => {
                              toast.error(error);
                            }}
                          />
                          <p className="text-xs text-muted-foreground text-center px-2">
                            Al completar el pago, recibirás un email de confirmación.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
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
                      <Button
                        className="w-full text-sm sm:text-base touch-manipulation"
                        size="lg"
                        onClick={handleRegister}
                        disabled={registering}
                        type="button"
                      >
                        {registering ? "Registrando..." : "Registrarse al evento"}
                      </Button>
                    ) : (
                      <EventPaymentButton
                        eventId={event.id!}
                        serviceAmount={event.price || 0}
                        eventName={event.name}
                        eventDate={event.event_date}
                        onError={(error) => {
                          toast.error(error);
                        }}
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

        {/* Sección de Preguntas y Respuestas */}
        <EventQuestionsSection
          eventId={eventId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isProfessional={isProfessional}
        />
      </div>
    </div>
  );
};

export default EventDetailPage;
