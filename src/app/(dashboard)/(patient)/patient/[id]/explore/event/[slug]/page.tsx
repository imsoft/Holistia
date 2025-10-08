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
  CheckCircle,
  XCircle
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

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
  
  const supabase = createClient();

  // Extraer ID del evento del slug
  // El slug tiene formato: "nombre-del-evento--uuid-del-evento"
  const eventId = slug.includes('--') ? slug.split('--').pop() : slug.split('-').pop();

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, supabase]);

  const fetchEventDetails = async () => {
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
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Error al cargar los detalles del evento");
    } finally {
      setLoading(false);
    }
  };

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
      advanced: "Avanzado"
    };
    return levels[level as keyof typeof levels] || level;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Evento no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              El evento que buscas no existe o ya no está disponible.
            </p>
            <Button onClick={() => router.back()}>
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
      <div className="container mx-auto px-4 py-8">

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagen principal */}
            {event.gallery_images && event.gallery_images.length > 0 && (
              <div className="relative">
                <Image
                  src={event.gallery_images[0]}
                  alt={event.name}
                  width={800}
                  height={400}
                  className="w-full h-64 md:h-80 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Información del evento */}
            <Card className="py-8">
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
                <CardTitle className="text-3xl font-bold">{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Descripción */}
                {event.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Detalles del evento */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{formatDate(event.event_date)}</p>
                      <p className="text-sm text-muted-foreground">Fecha del evento</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{formatTime(event.event_time)}</p>
                      <p className="text-sm text-muted-foreground">Hora de inicio</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.location}</p>
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.max_capacity} personas</p>
                      <p className="text-sm text-muted-foreground">Cupo máximo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.duration_hours} horas</p>
                      <p className="text-sm text-muted-foreground">Duración</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{getParticipantLevelLabel(event.participant_level)}</p>
                      <p className="text-sm text-muted-foreground">Nivel requerido</p>
                    </div>
                  </div>
                </div>

                {/* Estacionamiento */}
                {event.has_parking && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Car className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Estacionamiento disponible</p>
                      <p className="text-sm text-green-600 dark:text-green-300">El lugar cuenta con estacionamiento</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galería de imágenes */}
            {event.gallery_images && event.gallery_images.length > 1 && (
              <Card className="py-8">
                <CardHeader>
                  <CardTitle>Galería de imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información del profesional */}
            {professional && (
              <Card className="py-8">
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

            {/* Registro */}
            <Card className="py-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Registro al evento
                </CardTitle>
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

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleRegister}
                  disabled={registering}
                >
                  {registering ? "Registrando..." : "Registrarse al evento"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Al registrarte, recibirás un email de confirmación con todos los detalles del evento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
