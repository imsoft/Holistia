"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Users, DollarSign, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { EventWorkshop } from "@/types/event";
import { StripeConnectSetup } from "@/components/ui/stripe-connect-setup";
import { EventRegistrationsList } from "@/components/ui/event-registrations-list";

export default function MyEventsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWorkshop | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);

  useEffect(() => {
    loadMyEvents();
    checkStripeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      // Obtener el user_id del profesional
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from("events_workshops")
        .select("*")
        .eq("owner_id", user.user.id)
        .eq("owner_type", "professional")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Error al cargar tus eventos");
    } finally {
      setLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Verificar si el profesional ya tiene Stripe configurado en su perfil
      const { data: professional } = await supabase
        .from("professional_applications")
        .select("stripe_account_id, stripe_onboarding_completed, stripe_charges_enabled")
        .eq("user_id", user.user.id)
        .single();

      if (professional?.stripe_account_id) {
        setStripeConnected(professional.stripe_onboarding_completed || false);
      }
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    }
  };

  const handleStripeConnected = () => {
    setStripeConnected(true);
    loadMyEvents();
    checkStripeStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Eventos</h1>
        <p className="text-muted-foreground">
          Gestiona tus eventos y visualiza las registraciones
        </p>
      </div>

      {/* Stripe Connect Setup */}
      {!stripeConnected && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Conecta tu cuenta de Stripe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Para recibir pagos de tus eventos, necesitas conectar tu cuenta de Stripe.
            </p>
            <StripeConnectSetup
              userId={userId}
              userType="professional"
              onConnected={handleStripeConnected}
            />
          </CardContent>
        </Card>
      )}

      {/* Lista de eventos */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes eventos</h3>
            <p className="text-muted-foreground">
              Un administrador debe crear eventos asignándote como dueño
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="md:flex">
                {event.gallery_images && event.gallery_images.length > 0 && (
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <Image
                      src={event.gallery_images[0]}
                      alt={event.name}
                      fill
                      className="object-cover"
                      style={{
                        objectPosition: event.image_position || "center center",
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={event.is_active ? "default" : "secondary"}>
                          {event.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        <Badge variant="outline">
                          {event.is_free ? "Gratis" : `$${event.price} MXN`}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(event.event_date).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Cupo: {event.max_capacity} personas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                      variant={selectedEvent?.id === event.id ? "secondary" : "default"}
                    >
                      {selectedEvent?.id === event.id ? "Ocultar registraciones" : "Ver registraciones"}
                    </Button>
                  </div>
                </div>
              </div>

              {selectedEvent?.id === event.id && (
                <div className="border-t p-6">
                  <EventRegistrationsList eventId={event.id!} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
