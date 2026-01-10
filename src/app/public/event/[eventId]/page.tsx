"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
  Share2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import EventPaymentButton from "@/components/ui/event-payment-button";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { EventQuestionsSection } from "@/components/events/event-questions-section";
import { use } from "react";

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventWorkshop | null>(null);
  const [professional, setProfessional] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    profession: string;
    profile_photo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Verificar si es admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("type")
          .eq("id", user.id)
          .maybeSingle();
        
        setIsAdmin(profile?.type === "admin");
        
        // Verificar si es el profesional del evento
        if (event?.professional_id) {
          const { data: professionalApp } = await supabase
            .from("professional_applications")
            .select("user_id")
            .eq("id", event.professional_id)
            .eq("user_id", user.id)
            .eq("status", "approved")
            .maybeSingle();
          
          setIsProfessional(!!professionalApp);
        }
      }
    };
    checkAuth();
  }, [supabase, event]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from("events_workshops")
          .select("*")
          .eq("id", eventId)
          .eq("is_active", true)
          .maybeSingle();

        if (eventError) throw eventError;
        if (!eventData) {
          setLoading(false);
          return;
        }
        
        setEvent(eventData);

        if (eventData?.professional_id) {
          const { data: professionalData } = await supabase
            .from("professional_applications")
            .select("id, first_name, last_name, profession, profile_photo")
            .eq("id", eventData.professional_id)
            .eq("status", "approved")
            .maybeSingle();

          if (professionalData) {
            setProfessional(professionalData);
          }
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        toast.error("Error al cargar los detalles del evento");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, supabase]);

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      espiritualidad: "Espiritualidad",
      salud_mental: "Salud Mental",
      salud_fisica: "Salud Física",
      alimentacion: "Alimentación",
      social: "Social"
    };
    return categories[category] || category;
  };

  const getParticipantLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      all: "Todos los niveles"
    };
    return levels[level] || level;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/public/event/${eventId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleAction = () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/public/event/${eventId}`);
      return;
    }
    router.push(`/patient/${currentUserId}/explore/event/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-4">El evento que buscas no existe o ya no está disponible.</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {(event.gallery_images?.[0] || event.image_url) && (
              <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg">
                <Image
                  src={event.gallery_images?.[0] || event.image_url || ""}
                  alt={event.name}
                  width={800}
                  height={400}
                  className="w-full h-full object-cover"
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

            <Card className="py-6 sm:py-8">
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {getCategoryLabel(event.category)}
                  </Badge>
                  <Badge variant={event.is_free ? "default" : "outline"} className="text-xs sm:text-sm">
                    {event.is_free ? "Gratuito" : `$${event.price}`}
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {event.description && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Descripción</h3>
                    <div 
                      className="text-sm sm:text-base text-foreground leading-relaxed prose prose-sm sm:prose-base max-w-none"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                )}

                <Separator />

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
                      <p className="text-xs sm:text-sm text-muted-foreground">Fecha del evento</p>
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
                </div>

                {event.has_parking && (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">Estacionamiento disponible</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start space-y-4 sm:space-y-6">
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

            <Card className="py-6 sm:py-8">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Registro al evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    {event.is_free ? "Gratuito" : `$${event.price}`}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {event.is_free ? "Evento sin costo" : "Costo por persona"}
                  </p>
                </div>

                {currentUserId ? (
                  <EventPaymentButton
                    eventId={event.id!}
                    serviceAmount={event.price || 0}
                    eventName={event.name}
                    eventDate={event.event_date}
                    onError={(error) => {
                      toast.error(error);
                    }}
                  />
                ) : (
                  <Button onClick={handleAction} className="w-full" size="lg">
                    {event.is_free ? "Registrarse al evento" : "Inicia sesión para registrarte"}
                  </Button>
                )}

                {!event.is_free && (
                  <p className="text-xs text-destructive font-semibold text-center px-2">
                    ⚠️ No hay reembolsos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <EventQuestionsSection
          eventId={eventId}
          currentUserId={currentUserId || undefined}
          isAdmin={isAdmin}
          isProfessional={isProfessional}
        />
      </div>
    </div>
  );
}
