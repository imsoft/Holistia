"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Share2,
  User,
  Car,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";

export default function PublicEventPage({
  params,
}: {
  params: { eventId: string };
}) {
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
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { eventId } = params;

  useEffect(() => {
    async function loadEvent() {
      const supabase = createClient();

      // Verificar si el usuario está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Obtener detalles del evento
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

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const nextImage = () => {
    if (event?.gallery_images) {
      setCurrentImageIndex((prev) =>
        prev === event.gallery_images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (event?.gallery_images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? event.gallery_images!.length - 1 : prev - 1
      );
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Evento no encontrado</p>
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
      {(event.gallery_images?.[0] || event.image_url) && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <Image
            src={event.gallery_images?.[0] || event.image_url || ""}
            alt={event.name}
            width={1920}
            height={1080}
            className="object-cover w-full h-full"
            style={{
              objectPosition: event.image_position || 'center center'
            }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg">
                  {event.name}
                </h1>
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
            {/* Información del evento */}
            <Card className="shadow-lg py-4">
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">
                    {getCategoryLabel(event.category)}
                  </Badge>
                  <Badge variant={event.is_free ? "default" : "outline"}>
                    {event.is_free ? "Gratuito" : `$${event.price}`}
                  </Badge>
                  <Badge variant="outline">
                    {event.session_type === 'unique' ? 'Evento único' : 'Evento recurrente'}
                  </Badge>
                </div>
                {(!event.gallery_images?.[0] && !event.image_url) && (
                  <CardTitle className="text-3xl md:text-4xl font-bold">
                    {event.name}
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Descripción */}
                {event.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                    <div
                      className="text-muted-foreground leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                )}

                <Separator />

                {/* Detalles del evento */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {event.end_date && event.event_date !== event.end_date
                          ? `${formatEventDate(event.event_date)} - ${formatEventDate(event.end_date)}`
                          : formatEventDate(event.event_date)
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.end_date && event.event_date !== event.end_date ? 'Fechas del evento' : 'Fecha del evento'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {formatEventTime(event.event_time)}
                        {event.end_time && ` - ${formatEventTime(event.end_time)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">Horario</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">{event.location}</p>
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">{event.max_capacity} personas</p>
                      <p className="text-sm text-muted-foreground">Cupo máximo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">{event.duration_hours} horas</p>
                      <p className="text-sm text-muted-foreground">Duración</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">{getParticipantLevelLabel(event.participant_level)}</p>
                      <p className="text-sm text-muted-foreground">Nivel requerido</p>
                    </div>
                  </div>
                </div>

                {/* Estacionamiento */}
                {event.has_parking && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Car className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Estacionamiento disponible</p>
                      <p className="text-sm text-green-600 dark:text-green-300">El lugar cuenta con estacionamiento</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galería de imágenes */}
            {event.gallery_images && event.gallery_images.length > 0 && (
              <Card className="shadow-lg py-4">
                <CardHeader>
                  <CardTitle className="text-xl">Galería de imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {event.gallery_images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openGallery(index)}
                      >
                        <Image
                          src={image}
                          alt={`${event.name} - Imagen ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-8">
            {/* Información del profesional */}
            {professional && (
              <Card className="shadow-lg py-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profesional a cargo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
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
                      <p className="font-medium">
                        {professional.first_name} {professional.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {professional.profession}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información del precio y registro */}
            <Card className="shadow-lg py-4">
              <CardHeader>
                <CardTitle>Registro al evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {event.is_free ? "Gratuito" : `$${event.price}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.is_free ? "Evento sin costo" : "Costo por persona"}
                  </p>
                </div>

                {!isAuthenticated && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Para registrarte en este evento, necesitas iniciar sesión o crear una cuenta
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
                      <Link href={`/patient/${event.id}/explore/event/${event.id}`}>
                        Ver detalles completos
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Accede al evento en tu panel de control para registrarte
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog del Carousel */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          <div className="relative w-full h-[80vh]">
            {event?.gallery_images && (
              <>
                <Image
                  src={event.gallery_images[currentImageIndex]}
                  alt={`${event.name} - Imagen ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />

                {/* Botón cerrar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
                  onClick={closeGallery}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Botón anterior */}
                {event.gallery_images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                )}

                {/* Botón siguiente */}
                {event.gallery_images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}

                {/* Contador de imágenes */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {event.gallery_images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
