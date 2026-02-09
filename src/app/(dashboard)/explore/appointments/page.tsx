"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  CalendarClock,
  Clock,
  MapPin,
  Monitor,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";

interface Professional {
  id: string;
  full_name: string;
  avatar_url?: string;
  especialidad?: string;
}

interface Payment {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  paid_at: string | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: 'presencial' | 'online';
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed' | 'patient_no_show' | 'professional_no_show';
  cost: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  professional: Professional;
  payments?: Payment[];
  cancelled_by?: 'patient' | 'professional';
  cancellation_reason?: string;
  no_show_marked_by?: 'patient' | 'professional';
  no_show_description?: string;
}

const statusConfig = {
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  completed: {
    label: "Completada",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertCircle,
  },
  paid: {
    label: "Pagada",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  patient_no_show: {
    label: "Paciente no asistió",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: UserX,
  },
  professional_no_show: {
    label: "Experto no asistió",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: UserX,
  },
};

const typeConfig = {
  presencial: {
    label: "Presencial",
    icon: Users,
    color: "text-blue-600",
  },
  online: {
    label: "En línea",
    icon: Monitor,
    color: "text-green-600",
  },
};

const FEEDBACK_RECENT_DAYS = 30;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedbackSubmittedIds, setFeedbackSubmittedIds] = useState<Set<string>>(new Set());
  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, { rating: number; comment: string }>>({});
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const userId = useUserId();

  // Mensaje al volver de Stripe tras cancelar el pago
  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      toast.info("Reserva cancelada. Puedes elegir otro horario cuando quieras.", {
        duration: 5000,
      });
      router.replace("/explore/appointments", { scroll: false });
    }
  }, [searchParams, router]);

  // Obtener citas del usuario
  useEffect(() => {
    const getAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching appointments for user:', userId);
        
        // Primero verificamos si el usuario está autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('User not authenticated:', authError);
          setError('Usuario no autenticado. Por favor inicia sesión.');
          return;
        }

        console.log('Authenticated user:', user.id, 'Looking for userId:', userId);

        // Verificar que el usuario autenticado coincida con el parámetro de la URL
        if (user.id !== userId) {
          console.log('User ID mismatch. Authenticated:', user.id, 'URL param:', userId);
          console.log('Redirecting to correct user URL...');
          // Redirigir a la URL correcta del usuario autenticado
          router.replace(`/explore/appointments`);
          return;
        }

        console.log('✅ User ID matches, proceeding to fetch appointments...');

        // Consulta a la tabla appointments
        const { data: appointmentsData, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)  // Usar el ID del usuario autenticado, no el parámetro
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) {
          console.error('Supabase error fetching appointments:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Manejar diferentes tipos de errores
          if (error.code === '42P01') {
            setError('La tabla de citas no existe. Por favor contacta al administrador.');
          } else if (error.code === '42501') {
            setError('No tienes permisos para acceder a las citas.');
          } else {
            setError(`Error al cargar las citas: ${error.message}`);
          }
          return;
        }

        console.log('Appointments fetched successfully:', appointmentsData);

        if (!appointmentsData || appointmentsData.length === 0) {
          console.log('No appointments found for user');
          setAppointments([]);
          return;
        }

        // Obtener pagos para todas las citas
        const appointmentIds = appointmentsData.map(apt => apt.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('id, appointment_id, status, paid_at')
          .in('appointment_id', appointmentIds);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }

        console.log('Payments found:', paymentsData?.length || 0);

        // Obtener información de los profesionales
        const professionalIds = [...new Set(appointmentsData.map(apt => apt.professional_id))];

        const { data: professionalsData } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profession, profile_photo, user_id, tolerance_minutes')
          .in('id', professionalIds);

        // Obtener avatares de profiles
        const userIds = professionalsData?.map(p => p.user_id).filter(Boolean) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);

        // Agregar información de pagos a las citas
        const appointmentsWithPayments = appointmentsData.map(apt => {
          const aptPayments = paymentsData?.filter(p => p.appointment_id === apt.id) || [];
          return {
            ...apt,
            payments: aptPayments
          };
        });

        // Combinar datos
        const formattedAppointments = appointmentsWithPayments.map(apt => {
          const prof = professionalsData?.find(p => p.id === apt.professional_id);
          const profile = profilesData?.find(p => p.id === prof?.user_id);

          return {
            ...apt,
            professional: {
              id: prof?.id || '',
              full_name: prof ? `${prof.first_name} ${prof.last_name}` : 'Experto',
              avatar_url: profile?.avatar_url || prof?.profile_photo,
              especialidad: prof?.profession,
              tolerance_minutes: prof?.tolerance_minutes || 15
            }
          };
        });

        setAppointments(formattedAppointments);

        // Cargar qué citas ya tienen feedback (para ocultar encuesta)
        const { data: feedbackRows } = await supabase
          .from("appointment_feedback")
          .select("appointment_id")
          .in("appointment_id", appointmentIds);
        setFeedbackSubmittedIds(
          new Set((feedbackRows || []).map((r: { appointment_id: string }) => r.appointment_id))
        );

        // Verificar si hay una nueva cita (creada en los últimos 30 segundos) para mostrar mensaje de tolerancia
        const now = new Date();
        const recentAppointments = formattedAppointments.filter(apt => {
          const createdAt = new Date(apt.created_at);
          const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;
          return diffSeconds < 30 && (apt.status === 'pending' || apt.status === 'confirmed');
        });

        if (recentAppointments.length > 0) {
          const latestAppointment = recentAppointments[0];
          const toleranceMinutes = latestAppointment.professional.tolerance_minutes || 15;
          toast.success("¡Cita agendada exitosamente!");
          toast.info(`Tiempo de tolerancia: ${toleranceMinutes} minutos. El experto esperará este tiempo antes de considerar la cita como no asistida.`);
        }
        
      } catch (error) {
        console.error('Unexpected error fetching appointments:', error);
        setError('Error inesperado al cargar las citas. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      getAppointments();
    } else {
      setError('ID de usuario no válido.');
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, router, refreshKey]);

  const openCancelDialog = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}/cancel`);
  };

  const openNoShowDialog = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}/no-show`);
  };

  const openRescheduleDialog = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}/reschedule`);
  };

  // Función para navegar a la página de explorar profesionales
  const handleNewAppointment = () => {
    router.push(`/patient/${userId}/explore`);
  };

  const formatDate = (dateString: string) => {
    // Crear la fecha usando componentes individuales para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexado
    
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isAppointmentRecentForFeedback = (appointmentDate: string) => {
    const [y, m, d] = appointmentDate.split("-").map(Number);
    const aptDate = new Date(y, m - 1, d);
    const now = new Date();
    const diffDays = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= FEEDBACK_RECENT_DAYS;
  };

  const submitAppointmentFeedback = async (appointmentId: string) => {
    const draft = feedbackDraft[appointmentId];
    if (!draft || draft.rating < 1 || draft.rating > 3) {
      toast.error("Elige una opción: Todo bien, Más o menos o No");
      return;
    }
    setFeedbackSubmittingId(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: draft.rating, comment: draft.comment.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Error al enviar. Intenta de nuevo.");
        return;
      }
      toast.success("Gracias por tu opinión. Nos ayuda a mejorar.");
      setFeedbackSubmittedIds((prev) => new Set([...prev, appointmentId]));
      setFeedbackDraft((prev) => {
        const next = { ...prev };
        delete next[appointmentId];
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setFeedbackSubmittingId(null);
    }
  };

  // Mostrar todas las citas próximas (confirmadas, pagadas y pendientes)
  const upcomingAppointments = appointments.filter(
    (appointment) => {
      return appointment.status === "confirmed" || appointment.status === "paid" || appointment.status === "pending";
    }
  );

  const pastAppointments = appointments
    .filter(
      (appointment) =>
        appointment.status === "completed" ||
        appointment.status === "cancelled" ||
        appointment.status === "patient_no_show" ||
        appointment.status === "professional_no_show"
    )
    .sort((a, b) => {
      const dateA = `${a.appointment_date}T${a.appointment_time}`;
      const dateB = `${b.appointment_date}T${b.appointment_time}`;
      return dateB.localeCompare(dateA);
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mis Citas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona tus próximas citas y revisa tu historial: con quién fuiste y cuándo.
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div>
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 sm:p-6 bg-card rounded-xl border border-border">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Error al cargar las citas</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => setRefreshKey(prev => prev + 1)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Citas próximas */}
            {upcomingAppointments.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
              Próximas Citas ({upcomingAppointments.length})
            </h2>
            <div className="grid gap-4 sm:gap-6">
              {upcomingAppointments.map((appointment) => {
                const StatusIcon = statusConfig[appointment.status as keyof typeof statusConfig].icon;
                const TypeIcon = typeConfig[appointment.appointment_type as keyof typeof typeConfig].icon;
                
                return (
                  <div
                    key={appointment.id}
                    className="p-4 sm:p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                      {/* Información del experto */}
                      <Link 
                        href={`/explore/professional/${appointment.professional.id}`}
                        className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={appointment.professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.professional.full_name)}&background=random`}
                          alt={appointment.professional.full_name}
                          width={80}
                          height={80}
                          className="h-16 w-16 sm:h-20 sm:w-20 aspect-square rounded-full object-cover border-2 border-border flex-shrink-0"
                        />
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {appointment.professional.full_name}
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            {appointment.professional.especialidad}
                          </p>
                        </div>
                      </Link>

                      {/* Información de la cita */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatDate(appointment.appointment_date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.appointment_time} ({appointment.duration_minutes} min)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${typeConfig[appointment.appointment_type as keyof typeof typeConfig].color}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {typeConfig[appointment.appointment_type as keyof typeof typeConfig].label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(appointment.cost, "MXN")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">
                            {appointment.location || (appointment.appointment_type === 'online' ? 'Consulta en línea' : 'Ubicación por confirmar')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge
                            className={statusConfig[appointment.status as keyof typeof statusConfig].color}
                          >
                            {statusConfig[appointment.status as keyof typeof statusConfig].label}
                          </Badge>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-center sm:justify-end lg:justify-center gap-2">
                        {appointment.status === "confirmed" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRescheduleDialog(appointment)}
                              className="w-full sm:w-auto"
                            >
                              <CalendarClock className="h-4 w-4 mr-1" />
                              Reprogramar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openCancelDialog(appointment)}
                              className="w-full sm:w-auto"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            {/* Verificar si la cita ya pasó para mostrar botón de no-show */}
                            {new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) < new Date() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openNoShowDialog(appointment)}
                                className="w-full sm:w-auto"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                No asistió
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notas */}
                    {appointment.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notas:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

            {/* Historial: citas pasadas (con quién y cuándo) */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Historial de citas
                </h2>
                <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                  Tus consultas anteriores con cada profesional y la fecha.
                </p>
                <div className="grid gap-3 sm:gap-4">
                  {pastAppointments.map((appointment) => {
                    const TypeIcon = typeConfig[appointment.appointment_type as keyof typeof typeConfig].icon;
                
                    return (
                      <div
                        key={appointment.id}
                        className="p-3 sm:p-4 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <Link 
                            href={`/explore/professional/${appointment.professional.id}`}
                            className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity flex-1 w-full sm:w-auto"
                          >
                            <Image
                              src={appointment.professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.professional.full_name)}&background=random`}
                              alt={appointment.professional.full_name}
                              width={60}
                              height={60}
                              className="h-12 w-12 sm:h-14 sm:w-14 aspect-square rounded-full object-cover border-2 border-border flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors">
                                  {appointment.professional.full_name}
                                </h3>
                                <Badge
                                  className={`${statusConfig[appointment.status as keyof typeof statusConfig].color} text-xs`}
                                >
                                  {statusConfig[appointment.status as keyof typeof statusConfig].label}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                {appointment.professional.especialidad}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(appointment.appointment_date)} a las {appointment.appointment_time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <TypeIcon className={`h-3 w-3 ${typeConfig[appointment.appointment_type as keyof typeof typeConfig].color}`} />
                                  {typeConfig[appointment.appointment_type as keyof typeof typeConfig].label}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatPrice(appointment.cost, "MXN")}
                                </div>
                              </div>
                            </div>
                          </Link>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleNewAppointment}
                              className="w-full sm:w-auto"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Nueva cita</span>
                              <span className="sm:hidden">Nueva</span>
                            </Button>
                          </div>
                        </div>

                        {/* Encuesta corta post-cita: ¿Todo bien con tu reserva? */}
                        {appointment.status === "completed" &&
                          !feedbackSubmittedIds.has(appointment.id) &&
                          isAppointmentRecentForFeedback(appointment.appointment_date) && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm font-medium text-foreground mb-2 sm:mb-3">
                              ¿Todo bien con tu reserva?
                            </p>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
                              {[
                                { value: 1, label: "Sí, todo bien" },
                                { value: 2, label: "Más o menos" },
                                { value: 3, label: "No" },
                              ].map(({ value, label }) => {
                                const draft = feedbackDraft[appointment.id] ?? { rating: 0, comment: "" };
                                const selected = draft.rating === value;
                                return (
                                  <Button
                                    key={value}
                                    type="button"
                                    variant={selected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                      setFeedbackDraft((prev) => ({
                                        ...prev,
                                        [appointment.id]: { ...(prev[appointment.id] ?? { rating: 0, comment: "" }), rating: value },
                                      }))
                                    }
                                    className="min-w-0"
                                  >
                                    {label}
                                  </Button>
                                );
                              })}
                            </div>
                            <Textarea
                              placeholder="Comentario opcional"
                              value={feedbackDraft[appointment.id]?.comment ?? ""}
                              onChange={(e) =>
                                setFeedbackDraft((prev) => ({
                                  ...prev,
                                  [appointment.id]: {
                                    ...(prev[appointment.id] ?? { rating: 0, comment: "" }),
                                    comment: e.target.value,
                                  },
                                }))
                              }
                              rows={2}
                              className="resize-none mb-3 text-sm"
                            />
                            <Button
                              size="sm"
                              disabled={feedbackSubmittingId === appointment.id || !(feedbackDraft[appointment.id]?.rating)}
                              onClick={() => submitAppointmentFeedback(appointment.id)}
                            >
                              {feedbackSubmittingId === appointment.id ? "Enviando…" : "Enviar"}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estado vacío */}
            {appointments.length === 0 && (
              <div className="text-center py-12 px-4">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  No se encontraron citas
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  No tienes citas programadas aún
                </p>
                <Button 
                  onClick={handleNewAppointment}
                  className="w-full sm:w-auto"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Primera Cita
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog para cancelar o marcar no-show */}
    </div>
  );
}
