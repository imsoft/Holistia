"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  parseISO,
  isToday,
  getMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Appointment } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { listUserGoogleCalendarEvents, syncAllAppointmentsToGoogleCalendar } from "@/actions/google-calendar";
import { RefreshCw } from "lucide-react";
import { GoogleCalendarIntegration } from "@/components/google-calendar-integration";

type CalendarView = "day" | "week" | "month" | "year";

interface AvailabilityBlock {
  id: string;
  title: string;
  block_type: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  day_of_week?: number;
  is_recurring?: boolean;
}

const viewLabels = {
  day: "Vista de día",
  week: "Vista de semana",
  month: "Vista de mes",
  year: "Vista de año",
};

export default function ProfessionalAppointments() {
  useUserStoreInit();
  const router = useRouter();
  const userId = useUserId();
  const supabase = createClient();

  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [professionalAppId, setProfessionalAppId] = useState<string>("");

  useEffect(() => {
    if (!userId) return;
    
    const fetchAppointments = async () => {
      try {
        const { data: professionalApp, error: profError } = await supabase
          .from("professional_applications")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "approved")
          .single();

        if (profError || !professionalApp) {
          console.error("Error obteniendo profesional:", profError);
          return;
        }

        setProfessionalAppId(professionalApp.id);

        // Obtener bloqueos de disponibilidad
        const { data: blocksData } = await supabase
          .from("availability_blocks")
          .select("*")
          .eq("professional_id", professionalApp.id);

        console.log('📋 Bloqueos de disponibilidad cargados:', {
          total: blocksData?.length || 0,
          external: blocksData?.filter(b => b.is_external_event).length || 0
        });

        if (blocksData) {
          setAvailabilityBlocks(blocksData);
        }

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_date,
            appointment_time,
            duration_minutes,
            appointment_type,
            status,
            cost,
            location,
            notes,
            patient_id,
            professional_id,
            created_at
          `
          )
          .eq("professional_id", professionalApp.id)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });

        if (appointmentsError || !appointmentsData) {
          console.error("Error obteniendo citas:", appointmentsError);
          return;
        }

        const patientIds = [...new Set(appointmentsData.map((apt) => apt.patient_id))];

        const { data: patientsData } = await supabase
          .from("professional_patient_info")
          .select("patient_id, full_name, phone, email")
          .eq("professional_id", professionalApp.id)
          .in("patient_id", patientIds);

        const appointmentIds = appointmentsData.map((apt) => apt.id);
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("appointment_id, status, amount")
          .in("appointment_id", appointmentIds);

        const formattedAppointments: Appointment[] = appointmentsData.map((apt) => {
          const patient = patientsData?.find((p) => p.patient_id === apt.patient_id);

          const hasSuccessfulPayment =
            paymentsData?.some(
              (p) => p.appointment_id === apt.id && p.status === "succeeded"
            ) || false;

          return {
            id: apt.id,
            patient: {
              name: patient?.full_name || `Paciente`,
              email: patient?.email || "No disponible",
              phone: patient?.phone || "No disponible",
            },
            date: apt.appointment_date,
            time: apt.appointment_time.substring(0, 5),
            duration: apt.duration_minutes,
            type: apt.appointment_type === "presencial" ? "Presencial" : "Online",
            status: apt.status as "confirmed" | "pending" | "cancelled" | "completed",
            location:
              apt.location || (apt.appointment_type === "online" ? "Online" : "Sin especificar"),
            notes: apt.notes || undefined,
            isPaid: hasSuccessfulPayment,
          };
        });

        // Intentar obtener eventos de Google Calendar
        if (userId) {
          try {
            const googleEventsResult = await listUserGoogleCalendarEvents(userId);

            if (googleEventsResult.success && 'events' in googleEventsResult && googleEventsResult.events) {
              // Convertir eventos de Google Calendar a formato Appointment
              const googleAppointments: Appointment[] = googleEventsResult.events
                .filter((event: any) => event.start?.dateTime) // Solo eventos con hora específica
                .map((event: any) => {
                  const startDate = new Date(event.start.dateTime);
                  const endDate = new Date(event.end.dateTime);
                  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

                  // Usar fecha local para evitar problemas de zona horaria
                  const localDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
                  const dateString = localDate.toISOString().split('T')[0];
                  
                  // Formatear hora en zona horaria local
                  const hours = startDate.getHours().toString().padStart(2, '0');
                  const minutes = startDate.getMinutes().toString().padStart(2, '0');
                  const timeString = `${hours}:${minutes}`;

                  return {
                    id: `google-${event.id}`,
                    patient: {
                      name: event.summary || "Evento de Google Calendar",
                      email: event.attendees?.[0]?.email || "",
                      phone: "",
                    },
                    date: dateString,
                    time: timeString,
                    duration: durationMinutes,
                    type: event.location?.includes("Online") ? "Online" : "Presencial",
                    status: "confirmed" as const,
                    location: event.location || "Google Calendar",
                    notes: event.description,
                    isPaid: false,
                  };
                });

              // Combinar citas de Holistia con eventos de Google Calendar
              const allAppointments = [...formattedAppointments, ...googleAppointments];

              // Ordenar por fecha y hora
              allAppointments.sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.time.localeCompare(b.time);
              });

              setAppointments(allAppointments);
            } else {
              setAppointments(formattedAppointments);
            }
          } catch (googleError) {
            console.log("No se pudieron cargar eventos de Google Calendar:", googleError);
            // Si falla Google Calendar, solo mostrar las citas de Holistia
            setAppointments(formattedAppointments);
          }
        } else {
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error("Error inesperado:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId, supabase]);

  // Navegación
  const handlePrevious = () => {
    if (view === "day") {
      setCurrentDate((prev) => addDays(prev, -1));
    } else if (view === "week") {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else if (view === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subYears(prev, 1));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate((prev) => addDays(prev, 1));
    } else if (view === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else if (view === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addYears(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Función para sincronizar calendario
  const handleSyncCalendar = async () => {
    setSyncing(true);
    try {
      // Primero verificar si el profesional tiene Google Calendar conectado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('google_calendar_connected')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        toast.error('Error al verificar la conexión de Google Calendar');
        setSyncing(false);
        return;
      }

      // Si no tiene Google Calendar conectado, redirigir a configuración
      if (!profile.google_calendar_connected) {
        toast.error('Primero debes conectar tu cuenta de Google Calendar', {
          description: 'Serás redirigido a la página de configuración',
          duration: 3000,
        });

        setTimeout(() => {
          window.location.href = `/settings`;
        }, 2000);

        setSyncing(false);
        return;
      }

      // Si está conectado, proceder con la sincronización
      if (!userId) {
        toast.error("No se pudo obtener el ID del usuario");
        return;
      }
      const result = await syncAllAppointmentsToGoogleCalendar(userId);
      if (result.success) {
        toast.success(result.message || 'Calendario sincronizado correctamente');
        // Recargar la página para actualizar las citas
        window.location.reload();
      } else {
        // Si el error es por cuenta no conectada, redirigir
        if (result.error?.includes('no está conectado') || result.error?.includes('Tokens') || result.error?.includes('Google Calendar')) {
          toast.error('Tu cuenta de Google Calendar no está configurada correctamente', {
            description: 'Serás redirigido a la página de configuración',
            duration: 3000,
          });

          setTimeout(() => {
            window.location.href = `/settings`;
          }, 2000);
        } else {
          toast.error(result.error || 'Error al sincronizar el calendario');
        }
      }
    } catch (error) {
      console.error('Error sincronizando calendario:', error);
      toast.error('Error al sincronizar el calendario');
    } finally {
      setSyncing(false);
    }
  };

  // Funciones de citas
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.date), date)
    );
  };

  const getAppointmentsForDateAndTime = (date: Date, hour: number) => {
    return appointments.filter((apt) => {
      if (!isSameDay(parseISO(apt.date), date)) return false;
      const aptHour = parseInt(apt.time.split(":")[0]);
      return aptHour === hour;
    });
  };

  const getAppointmentsForMonth = (year: number, month: number) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.date);
      return aptDate.getFullYear() === year && getMonth(aptDate) === month;
    });
  };

  // Funciones de bloqueos
  const getBlocksForDate = (date: Date) => {
    return availabilityBlocks.filter((block) => {
      const blockStart = parseISO(block.start_date);
      const blockEnd = block.end_date ? parseISO(block.end_date) : blockStart;

      // Normalizar fechas
      blockStart.setHours(0, 0, 0, 0);
      blockEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      // Para bloqueos recurrentes por día de semana
      if (block.is_recurring && block.block_type === 'weekly_day') {
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
        return block.day_of_week === dayOfWeek;
      }

      // Para bloqueos recurrentes de rango de horas
      if (block.is_recurring && block.block_type === 'weekly_range') {
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
        const startDayOfWeek = blockStart.getDay() === 0 ? 7 : blockStart.getDay();
        const endDayOfWeek = blockEnd.getDay() === 0 ? 7 : blockEnd.getDay();
        return dayOfWeek >= startDayOfWeek && dayOfWeek <= endDayOfWeek;
      }

      // Para bloqueos no recurrentes
      return checkDate >= blockStart && checkDate <= blockEnd;
    });
  };

  const isTimeBlocked = (date: Date, hour: number) => {
    const dayBlocks = getBlocksForDate(date);
    const timeString = `${hour.toString().padStart(2, '0')}:00`;

    // Verificar si hay bloqueo de día completo
    const hasFullDayBlock = dayBlocks.some(block =>
      block.block_type === 'full_day' || block.block_type === 'weekly_day'
    );

    if (hasFullDayBlock) return true;

    // Verificar si hay bloqueo de rango de horas
    return dayBlocks.some(block => {
      if ((block.block_type === 'time_range' || block.block_type === 'weekly_range') &&
          block.start_time && block.end_time) {
        return timeString >= block.start_time && timeString < block.end_time;
      }
      return false;
    });
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch("/api/appointments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Error al confirmar la cita");
        return;
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Cita confirmada correctamente. Se ha enviado un email al paciente.");
        
        // Actualizar el estado de las citas
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: "confirmed" as const } : apt
          )
        );
        
        // Actualizar la cita seleccionada si es la misma
        if (selectedAppointment && selectedAppointment.id === appointmentId) {
          setSelectedAppointment({ ...selectedAppointment, status: "confirmed" as const });
        }
        
        // Cerrar el modal
        setIsViewDialogOpen(false);
        
        // Recargar las citas para asegurar que todo esté actualizado
        const fetchAppointments = async () => {
          try {
            // Obtener el ID de la aplicación profesional
            const { data: professionalApp } = await supabase
              .from('professional_applications')
              .select('id')
              .eq('user_id', userId)
              .eq('status', 'approved')
              .single();

            if (professionalApp) {
              setProfessionalAppId(professionalApp.id);

              // Obtener citas del profesional
              const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
                  id,
                  appointment_date,
                  appointment_time,
                  duration_minutes,
                  appointment_type,
                  status,
                  location,
                  notes,
                  patient_id
                `)
                .eq('professional_id', professionalApp.id)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true });

              if (appointmentsError) {
                console.error('Error obteniendo citas:', appointmentsError);
                return;
              }

              // Formatear citas (similar al código existente)
              const formattedAppointments: Appointment[] = (appointmentsData || []).map((apt) => {
                const patient = (window as any).__patientCache?.[apt.patient_id];
                const hasSuccessfulPayment = false;

                return {
                  id: apt.id,
                  patient: {
                    name: patient?.full_name || `Paciente`,
                    email: patient?.email || "No disponible",
                    phone: patient?.phone || "No disponible",
                  },
                  date: apt.appointment_date,
                  time: apt.appointment_time.substring(0, 5),
                  duration: apt.duration_minutes,
                  type: apt.appointment_type === "presencial" ? "Presencial" : "Online",
                  status: apt.status as "confirmed" | "pending" | "cancelled" | "completed",
                  location:
                    apt.location || (apt.appointment_type === "online" ? "Online" : "Sin especificar"),
                  notes: apt.notes || undefined,
                  isPaid: hasSuccessfulPayment,
                };
              });

              setAppointments(formattedAppointments);
            }
          } catch (error) {
            console.error("Error recargando citas:", error);
          }
        };

        await fetchAppointments();
      } else {
        toast.error(result.error || "Error al confirmar la cita");
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      toast.error("Error inesperado al confirmar la cita");
    }
  };

  const openCancelDialog = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}/cancel`);
  };

  const openNoShowDialog = (appointment: Appointment) => {
    router.push(`/professional/${userId}/appointments/${appointment.id}/no-show`);
  };

  const openRescheduleDialog = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}/reschedule`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Completada";
      default:
        return status;
    }
  };

  // Generar título según la vista
  const getTitle = () => {
    if (view === "day") {
      return format(currentDate, "d 'de' MMMM, yyyy", { locale: es });
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
    } else if (view === "month") {
      return format(currentDate, "MMMM yyyy", { locale: es });
    } else {
      return format(currentDate, "yyyy", { locale: es });
    }
  };

  // Renderizar vistas
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const HOUR_HEIGHT = 80; // Altura de cada hora en píxeles

    // Obtener citas del día actual
    const dayAppointments = appointments.filter((apt) =>
      isSameDay(parseISO(apt.date), currentDate)
    );

    // Obtener bloqueos del día actual
    const dayBlocks = getBlocksForDate(currentDate);

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[80px_1fr]">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="text-xs text-muted-foreground py-4 text-center bg-muted/30 border-r border-border" style={{ height: `${HOUR_HEIGHT}px` }}>
                  {format(new Date().setHours(hour, 0), "ha", { locale: es })}
                </div>
                <div className={`border-t border-border relative ${isTimeBlocked(currentDate, hour) ? 'bg-gray-100 dark:bg-gray-800' : ''}`} style={{ height: `${HOUR_HEIGHT}px` }}>
                  {/* Renderizar indicador de bloqueo */}
                  {isTimeBlocked(currentDate, hour) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">Bloqueado</div>
                    </div>
                  )}

                  {/* Renderizar citas que comienzan en esta hora */}
                  {dayAppointments
                    .filter((apt) => {
                      const aptHour = parseInt(apt.time.split(":")[0]);
                      return aptHour === hour;
                    })
                    .map((apt) => {
                      const [, startMinute] = apt.time.split(":").map(Number);
                      const durationHours = apt.duration / 60;
                      const heightInPixels = durationHours * HOUR_HEIGHT;
                      const topOffset = (startMinute / 60) * HOUR_HEIGHT;

                      return (
                        <button
                          key={apt.id}
                          onClick={() => handleViewAppointment(apt)}
                          className={`absolute left-1 right-1 px-3 py-2 rounded-md text-sm border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity overflow-hidden z-10`}
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(heightInPixels - 4, 40)}px`,
                          }}
                        >
                          <div className="font-semibold truncate">{apt.patient.name}</div>
                          <div className="text-xs mt-1">
                            {apt.time} • {apt.duration} min
                          </div>
                          {heightInPixels > 60 && <div className="text-xs">{apt.type}</div>}
                        </button>
                      );
                    })}

                  {/* Renderizar bloqueos específicos de tiempo */}
                  {dayBlocks
                    .filter(block =>
                      (block.block_type === 'time_range' || block.block_type === 'weekly_range') &&
                      block.start_time && block.end_time
                    )
                    .map((block) => {
                      if (!block.start_time || !block.end_time) return null;

                      const [startHour, startMinute] = block.start_time.split(":").map(Number);
                      const [endHour, endMinute] = block.end_time.split(":").map(Number);

                      if (startHour !== hour && !(hour >= startHour && hour < endHour)) return null;

                      const topOffset = hour === startHour ? (startMinute / 60) * HOUR_HEIGHT : 0;
                      const endOffset = hour === endHour - 1 ? (endMinute / 60) * HOUR_HEIGHT : HOUR_HEIGHT;
                      const heightInPixels = endOffset - topOffset;

                      return (
                        <div
                          key={block.id}
                          className="absolute left-1 right-1 px-2 py-1 rounded-md text-xs bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                          style={{
                            top: `${topOffset}px`,
                            height: `${heightInPixels - 4}px`,
                          }}
                        >
                          <div className="font-medium truncate">{block.title || 'Bloqueado'}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const HOUR_HEIGHT = 60; // Altura de cada hora en píxeles

    return (
      <div className="flex flex-col h-full">
        {/* Días de la semana */}
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-0 border-b border-border sticky top-0 bg-background z-10">
          <div className="w-16" />
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`text-center py-3 border-l border-border ${
                isToday(day) ? "bg-primary/5" : ""
              }`}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, "EEE", { locale: es })}
              </div>
              <div
                className={`text-2xl font-semibold ${
                  isToday(day) ? "text-primary" : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horas */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-0">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="text-xs text-muted-foreground pr-2 py-2 text-right w-16 sticky left-0 bg-background border-r border-border" style={{ height: `${HOUR_HEIGHT}px` }}>
                  {format(new Date().setHours(hour, 0), "ha", { locale: es })}
                </div>
                {weekDays.map((day, dayIdx) => {
                  // Obtener citas de este día
                  const dayAppointments = appointments.filter((apt) =>
                    isSameDay(parseISO(apt.date), day)
                  );

                  // Obtener bloqueos de este día
                  const dayBlocks = getBlocksForDate(day);
                  const isHourBlocked = isTimeBlocked(day, hour);

                  return (
                    <div
                      key={dayIdx}
                      className={`border-t border-l border-border relative ${
                        isToday(day) ? "bg-primary/5" : isHourBlocked ? "bg-gray-50 dark:bg-gray-900" : ""
                      }`}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      {/* Indicador de bloqueo */}
                      {isHourBlocked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">🔒</div>
                        </div>
                      )}

                      {/* Renderizar citas que comienzan en esta hora */}
                      {dayAppointments
                        .filter((apt) => {
                          const aptHour = parseInt(apt.time.split(":")[0]);
                          return aptHour === hour;
                        })
                        .map((apt) => {
                          const [, startMinute] = apt.time.split(":").map(Number);
                          const durationHours = apt.duration / 60;
                          const heightInPixels = durationHours * HOUR_HEIGHT;
                          const topOffset = (startMinute / 60) * HOUR_HEIGHT;

                          return (
                            <button
                              key={apt.id}
                              onClick={() => handleViewAppointment(apt)}
                              className={`absolute left-0.5 right-0.5 px-2 py-1 rounded text-xs border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity overflow-hidden z-10`}
                              style={{
                                top: `${topOffset}px`,
                                height: `${Math.max(heightInPixels - 2, 30)}px`,
                              }}
                            >
                              <div className="font-semibold truncate">
                                {apt.patient.name}
                              </div>
                              <div className="truncate">{apt.time}</div>
                            </button>
                          );
                        })}

                      {/* Renderizar bloqueos específicos de tiempo */}
                      {dayBlocks
                        .filter(block =>
                          (block.block_type === 'time_range' || block.block_type === 'weekly_range') &&
                          block.start_time && block.end_time
                        )
                        .map((block) => {
                          if (!block.start_time || !block.end_time) return null;

                          const [startHour, startMinute] = block.start_time.split(":").map(Number);
                          const [endHour] = block.end_time.split(":").map(Number);

                          if (startHour !== hour && !(hour >= startHour && hour < endHour)) return null;

                          const topOffset = hour === startHour ? (startMinute / 60) * HOUR_HEIGHT : 0;
                          const heightInPixels = HOUR_HEIGHT - topOffset;

                          return (
                            <div
                              key={block.id}
                              className="absolute left-0.5 right-0.5 px-1 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 truncate"
                              style={{
                                top: `${topOffset}px`,
                                height: `${Math.max(heightInPixels - 2, 20)}px`,
                              }}
                              title={block.title || 'Bloqueado'}
                            >
                              {block.title || 'Bloqueado'}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className="flex flex-col h-full">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-0 border-b border-border">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, idx) => (
            <div
              key={idx}
              className="text-center text-xs font-semibold text-muted-foreground py-3 border-r last:border-r-0 border-border"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="flex-1 grid grid-rows-[repeat(auto-fit,minmax(0,1fr))]">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-0 border-b last:border-b-0 border-border">
              {week.map((day, dayIdx) => {
                const dayAppointments = getAppointmentsForDate(day);
                const dayBlocks = getBlocksForDate(day);
                const hasFullDayBlock = dayBlocks.some(block =>
                  block.block_type === 'full_day' || block.block_type === 'weekly_day'
                );
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={dayIdx}
                    className={`min-h-[120px] border-r last:border-r-0 border-border p-2 ${
                      !isCurrentMonth ? "bg-muted/20" : hasFullDayBlock ? "bg-gray-50 dark:bg-gray-900" : ""
                    } ${isDayToday ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className={`text-sm font-semibold ${
                          !isCurrentMonth
                            ? "text-muted-foreground"
                            : isDayToday
                            ? "text-primary"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                      {hasFullDayBlock && (
                        <div className="text-xs text-gray-500 dark:text-gray-400" title="Día bloqueado">🔒</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <button
                          key={apt.id}
                          onClick={() => handleViewAppointment(apt)}
                          className={`w-full text-left px-2 py-1 rounded text-xs border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity truncate`}
                        >
                          <div className="font-medium truncate">
                            {apt.time} {apt.patient.name}
                          </div>
                        </button>
                      ))}
                      {dayBlocks.length > 0 && !hasFullDayBlock && dayAppointments.length < 2 && (
                        <div className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 truncate">
                          <div className="font-medium truncate">
                            {dayBlocks[0].title || 'Bloqueado'}
                          </div>
                        </div>
                      )}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{dayAppointments.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.map((monthIndex) => {
            const monthDate = new Date(year, monthIndex, 1);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
            const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
            const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
            const monthAppointments = getAppointmentsForMonth(year, monthIndex);

            return (
              <div key={monthIndex} className="border border-border rounded-lg p-3 bg-card">
                <h3 className="text-sm font-semibold text-center mb-2 capitalize">
                  {format(monthDate, "MMMM", { locale: es })}
                </h3>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["D", "L", "M", "M", "J", "V", "S"].map((day, idx) => (
                    <div
                      key={idx}
                      className="text-center text-[10px] font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, dayIdx) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isCurrentMonth = isSameMonth(day, monthDate);
                    const isDayToday = isToday(day);

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setCurrentDate(day);
                            setView("day");
                          }
                        }}
                        disabled={!isCurrentMonth}
                        className={`
                          relative aspect-square flex items-center justify-center text-[11px] rounded
                          ${!isCurrentMonth ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                          ${isDayToday ? "font-bold ring-2 ring-primary" : ""}
                          ${
                            dayAppointments.length > 0 && isCurrentMonth
                              ? "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                              : ""
                          }
                          ${dayAppointments.length === 0 && isCurrentMonth ? "hover:bg-muted/50 cursor-pointer" : ""}
                          transition-colors
                        `}
                      >
                        {format(day, "d")}
                        {dayAppointments.length > 0 && isCurrentMonth && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                            <div className="h-1 w-1 rounded-full bg-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Contador de citas del mes */}
                {monthAppointments.length > 0 && (
                  <div className="mt-2 text-center text-[10px] text-muted-foreground">
                    {monthAppointments.length} cita{monthAppointments.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Calendario de Citas</h1>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-card sticky top-16 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-base sm:text-lg font-semibold capitalize">{getTitle()}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => router.push(`/appointments/new`)}
              className="w-full sm:w-auto"
            >
              + Nueva Cita
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncCalendar}
              disabled={syncing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar calendario'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  {viewLabels[view]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setView("day")}>
                  Vista de día
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("week")}>
                  Vista de semana
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("month")}>
                  Vista de mes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("year")}>
                  Vista de año
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        <div className="h-full bg-card border border-border rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
          {view === "day" && renderDayView()}
          {view === "week" && renderWeekView()}
          {view === "month" && renderMonthView()}
          {view === "year" && renderYearView()}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la cita seleccionada
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (() => {
            const isGoogleCalendarEvent = selectedAppointment.id.startsWith('google-');

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Paciente
                    </div>
                    <div className="text-base">{selectedAppointment.patient.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Estado
                    </div>
                    <Badge className={getStatusColor(selectedAppointment.status)}>
                      {getStatusText(selectedAppointment.status)}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Fecha</div>
                    <div className="text-base">
                      {format(parseISO(selectedAppointment.date), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Hora</div>
                    <div className="text-base">{selectedAppointment.time}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Duración
                    </div>
                    <div className="text-base">{selectedAppointment.duration} minutos</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                    <div className="text-base">{selectedAppointment.type}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Ubicación
                    </div>
                    <div className="text-base">{selectedAppointment.location}</div>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Notas
                      </div>
                      <div className="text-base">{selectedAppointment.notes}</div>
                    </div>
                  )}
                  {isGoogleCalendarEvent && (
                    <div className="col-span-2">
                      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Este evento proviene de Google Calendar y no puede ser modificado desde aquí.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!isGoogleCalendarEvent && (
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedAppointment.status === "pending" && (
                      <Button
                        onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                        className="flex-1"
                      >
                        Confirmar cita
                      </Button>
                    )}
                    {selectedAppointment.status === "confirmed" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => openRescheduleDialog(selectedAppointment)}
                          className="flex-1"
                        >
                          Reprogramar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => openCancelDialog(selectedAppointment)}
                          className="flex-1"
                        >
                          Cancelar cita
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Google Calendar Integration */}
      <div className="p-6">
        <GoogleCalendarIntegration userId={userId} />
      </div>
    </div>
  );
}
