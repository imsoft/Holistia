"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  User,
  Car,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [event, setEvent] = useState<EventWorkshop | null>(null);
  const [professional, setProfessional] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    profession: string;
    profile_photo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'details' | 'instructor'>('about');

  useEffect(() => {
    async function loadEvent() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      const { data: eventData, error: eventError } = await supabase
        .from("events_workshops")
        .select("*")
        .eq("id", eventId)
        .eq("is_active", true)
        .single();

      if (eventError) {
        console.error("Error loading event:", eventError);
        toast.error("No se pudo cargar la información del evento");
        setLoading(false);
        return;
      }

      setEvent(eventData);

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

      setLoading(false);
    }

    loadEvent();
  }, [eventId]);

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/event/${eventId}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Evento no encontrado</p>
          <Link href="/" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    `${formatEventDate(event.event_date)} a las ${formatEventTime(event.event_time)}`,
    `${event.max_capacity} personas máximo`,
    `Duración: ${event.duration_hours} horas`,
    event.has_parking && 'Estacionamiento disponible',
  ].filter(Boolean) as string[];

  return (
    <div className="bg-background">
      <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
          {/* Event image */}
          <div className="lg:col-span-4 lg:row-end-1">
            {(event.gallery_images?.[0] || event.image_url) ? (
              <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  alt={event.name}
                  src={event.gallery_images?.[0] || event.image_url || ""}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover object-center"
                  style={{
                    objectPosition: event.image_position || 'center center'
                  }}
                  priority
                />
              </div>
            ) : (
              <div className="aspect-4/3 w-full rounded-lg bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-background/50 mx-auto mb-4 flex items-center justify-center">
                    <CalendarCheck className="w-16 h-16 text-purple-600" />
                  </div>
                  <p className="text-xl font-semibold text-purple-900">{event.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Event details */}
          <div className="mx-auto mt-14 max-w-2xl sm:mt-16 lg:col-span-3 lg:row-span-2 lg:row-end-2 lg:mt-0 lg:max-w-none">
            <div className="flex flex-col-reverse">
              <div className="mt-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {event.name}
                </h1>

                <h2 id="information-heading" className="sr-only">
                  Información del evento
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                    {getCategoryLabel(event.category)}
                  </Badge>
                  <Badge variant={event.is_free ? "default" : "outline"}>
                    {event.is_free ? "Gratuito" : `$${event.price} MXN`}
                  </Badge>
                  <Badge variant="outline">
                    {event.session_type === 'unique' ? 'Evento único' : 'Evento recurrente'}
                  </Badge>
                </div>
              </div>
            </div>

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
                    <Link href={`/patient/${event.id}/explore/event/${event.id}`}>
                      <Calendar className="w-5 h-5 mr-2" />
                      Registrarme en el evento
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h3 className="text-sm font-medium text-foreground">Información destacada</h3>
                <div className="mt-4">
                  <ul role="list" className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-purple-300">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="pl-2">
                        <span className="text-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Precio */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-foreground">Precio</h3>
              <div className="mt-4">
                <p className="text-2xl font-bold text-purple-600">
                  {event.is_free ? "Gratuito" : `$${event.price} MXN`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.is_free ? "Evento sin costo" : "Costo por persona"}
                </p>
              </div>
            </div>

            {/* Share */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-foreground">Compartir evento</h3>
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
                      : "border-transparent text-foreground hover:border-border hover:text-foreground",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Descripción
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={classNames(
                    activeTab === 'details'
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-foreground hover:border-border hover:text-foreground",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Detalles
                </button>
                {professional && (
                  <button
                    onClick={() => setActiveTab('instructor')}
                    className={classNames(
                      activeTab === 'instructor'
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-foreground hover:border-border hover:text-foreground",
                      "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                    )}
                  >
                    Instructor
                  </button>
                )}
              </div>
            </div>

            {/* Tab panels */}
            <div className="mt-10">
              {activeTab === 'about' && event.description && (
                <div className="text-sm text-muted-foreground">
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-purple-600 prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Fecha y hora</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.end_date && event.event_date !== event.end_date
                          ? `${formatEventDate(event.event_date)} - ${formatEventDate(event.end_date)}`
                          : formatEventDate(event.event_date)
                        }
                        {' a las '}
                        {formatEventTime(event.event_time)}
                        {event.end_time && ` - ${formatEventTime(event.end_time)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Ubicación</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Cupo máximo</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{event.max_capacity} personas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Duración</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{event.duration_hours} horas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Nivel requerido</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{getParticipantLevelLabel(event.participant_level)}</p>
                    </div>
                  </div>

                  {event.has_parking && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <Car className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Estacionamiento</h4>
                        <p className="mt-1 text-sm text-muted-foreground">El lugar cuenta con estacionamiento disponible</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'instructor' && professional && (
                <div className="space-y-6">
                  <div className="flex items-start gap-6">
                    {professional.profile_photo ? (
                      <Image
                        src={professional.profile_photo}
                        alt={`${professional.first_name} ${professional.last_name}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-foreground">
                        {professional.first_name} {professional.last_name}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">{professional.profession}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery section */}
        {event.gallery_images && event.gallery_images.length > 1 && (
          <div className="mx-auto mt-24 max-w-2xl sm:mt-32 lg:max-w-none">
            <div className="flex items-center justify-between space-x-4">
              <h2 className="text-lg font-medium text-foreground">Galería del evento</h2>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
              {event.gallery_images.slice(1).map((image, index) => (
                <div key={index} className="group relative">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      alt={`${event.name} - Imagen ${index + 2}`}
                      src={image}
                      fill
                      className="object-cover object-center group-hover:opacity-75 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
