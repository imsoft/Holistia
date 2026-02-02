"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { formatPrice } from "@/lib/price-utils";

interface EventDetails {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  price: number;
  is_free: boolean;
  max_capacity: number;
  duration_hours: number;
  gallery_images: string[] | null;
  professional_id: string | null;
}

interface Registration {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  registration_date: string;
  confirmation_code: string | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  special_requirements: string | null;
  attended: boolean | null;
  user: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  payment: {
    amount: number;
    status: string;
    paid_at: string | null;
  } | null;
}

export default function EventRegistrationsDetailPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const adminId = useUserId();
  const eventId = params?.eventId as string;
  const supabase = createClient();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener detalles del evento
        const { data: eventData, error: eventError } = await supabase
          .from('events_workshops')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Obtener registros del evento con información del usuario
        const { data: registrationsData, error: registrationsError } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', eventId)
          .order('registration_date', { ascending: false });

        if (registrationsError) throw registrationsError;

        // Obtener información de usuarios (profiles)
        const userIds = [...new Set((registrationsData || []).map((r: any) => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map();
        (profilesData || []).forEach((p: any) => {
          profilesMap.set(p.id, p);
        });

        // Obtener pagos relacionados con estos registros
        const registrationIds = (registrationsData || []).map((r: any) => r.id);
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('id, event_registration_id, amount, status, paid_at')
          .in('event_registration_id', registrationIds);

        // Crear un mapa de pagos por registration_id
        const paymentsMap = new Map();
        (paymentsData || []).forEach((p: any) => {
          if (p.event_registration_id) {
            paymentsMap.set(p.event_registration_id, {
              amount: Number(p.amount) || 0,
              status: p.status,
              paid_at: p.paid_at,
            });
          }
        });

        // Transformar los datos para que coincidan con la interfaz
        const transformedRegistrations = (registrationsData || []).map((reg: any) => {
          const profile = profilesMap.get(reg.user_id);
          return {
            ...reg,
            user: profile || {
              email: 'Usuario eliminado',
              first_name: null,
              last_name: null,
              avatar_url: null,
            },
            payment: paymentsMap.get(reg.id) || null,
          };
        });

        setRegistrations(transformedRegistrations);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos del evento');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, supabase]);

  const handleMarkAttendance = async (registrationId: string, attended: boolean) => {
    try {
      setUpdating(registrationId);
      
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended })
        .eq('id', registrationId);

      if (error) throw error;

      // Actualizar estado local
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registrationId ? { ...reg, attended } : reg
        )
      );

      toast.success(attended ? 'Asistencia marcada' : 'No asistencia marcada');
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error al actualizar la asistencia');
    } finally {
      setUpdating(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      espiritualidad: 'Espiritualidad',
      salud_mental: 'Salud Mental',
      salud_fisica: 'Salud Física',
      alimentacion: 'Alimentación',
      social: 'Social',
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Confirmado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Completado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAttendanceBadge = (attended: boolean | null) => {
    if (attended === null) {
      return <Badge variant="outline">Sin marcar</Badge>;
    }
    if (attended) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Asistió</Badge>;
    }
    return <Badge variant="destructive">No asistió</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Evento no encontrado</p>
            <Button onClick={() => router.push(`/admin/${adminId}/events`)} className="mt-4">
              Volver a Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${adminId}/events`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Registrados del Evento</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {event.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Información del Evento */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Información del Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {event.gallery_images && event.gallery_images.length > 0 && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={event.gallery_images[0]}
                    alt={event.name}
                    fill
                    className="object-cover"
                    unoptimized={event.gallery_images[0].includes('supabase.co') || event.gallery_images[0].includes('supabase.in')}
                  />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                  <Badge variant="secondary" className="mb-2">
                    {getCategoryLabel(event.category)}
                  </Badge>
                  {event.is_free ? (
                    <Badge className="ml-2">Gratuito</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2">
                      {formatPrice(event.price, 'MXN')}
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <div
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatEventDate(event.event_date)} a las {formatEventTime(event.event_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Cupo: {event.max_capacity} personas · {registrations.length} registrados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Duración: {event.duration_hours} horas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Registrados */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Personas Registradas</CardTitle>
            <CardDescription>
              {registrations.length} {registrations.length === 1 ? 'persona registrada' : 'personas registradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay personas registradas en este evento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((registration) => (
                  <Card key={registration.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="relative">
                            {registration.user.avatar_url ? (
                              <Image
                                src={registration.user.avatar_url}
                                alt={registration.user.email}
                                width={48}
                                height={48}
                                className="rounded-full border-2 border-border"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                                <User className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Información del usuario */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {registration.user.first_name && registration.user.last_name
                                  ? `${registration.user.first_name} ${registration.user.last_name}`
                                  : registration.user.email}
                              </h3>
                              {getStatusBadge(registration.status)}
                              {getAttendanceBadge(registration.attended)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{registration.user.email}</span>
                              </div>
                              {registration.confirmation_code && (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3" />
                                  <span>Código: {registration.confirmation_code}</span>
                                </div>
                              )}
                              {registration.emergency_contact_name && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>Contacto: {registration.emergency_contact_name}
                                    {registration.emergency_contact_phone && ` - ${registration.emergency_contact_phone}`}
                                  </span>
                                </div>
                              )}
                              {registration.payment && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />
                                  <span>
                                    Pago: {formatPrice(registration.payment.amount, 'MXN')} - 
                                    <Badge variant={registration.payment.status === 'succeeded' ? 'default' : 'secondary'} className="ml-1">
                                      {registration.payment.status === 'succeeded' ? 'Pagado' : registration.payment.status}
                                    </Badge>
                                  </span>
                                </div>
                              )}
                              {registration.notes && (
                                <div className="mt-2 text-xs">
                                  <strong>Notas:</strong> {registration.notes}
                                </div>
                              )}
                              {registration.special_requirements && (
                                <div className="mt-2 text-xs">
                                  <strong>Requisitos especiales:</strong> {registration.special_requirements}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant={registration.attended === true ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMarkAttendance(registration.id, true)}
                            disabled={updating === registration.id}
                            className="flex items-center gap-2"
                          >
                            {updating === registration.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Asistió
                          </Button>
                          <Button
                            variant={registration.attended === false ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleMarkAttendance(registration.id, false)}
                            disabled={updating === registration.id}
                            className="flex items-center gap-2"
                          >
                            {updating === registration.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            No asistió
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
