"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
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
  parseISO,
  isToday,
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
import { AppointmentActionsDialog } from "@/components/appointments/appointment-actions-dialog";
import { RescheduleAppointmentDialog } from "@/components/appointments/reschedule-appointment-dialog";
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog";
import { toast } from "sonner";

type CalendarView = "day" | "week" | "month";

const viewLabels = {
  day: "Vista de día",
  week: "Vista de semana",
  month: "Vista de mes",
};

export default function ProfessionalAppointments() {
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [professionalAppId, setProfessionalAppId] = useState<string>("");
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    actionType: "cancel" | "no-show" | null;
    appointmentDetails?: {
      professionalName?: string;
      patientName?: string;
      date: string;
      time: string;
      cost: number;
    };
  }>({
    isOpen: false,
    appointmentId: null,
    actionType: null,
  });

  const [rescheduleDialogState, setRescheduleDialogState] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    currentDate: string;
    currentTime: string;
    appointmentDetails?: {
      patientName?: string;
      cost: number;
    };
  }>({
    isOpen: false,
    appointmentId: null,
    currentDate: "",
    currentTime: "",
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
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

        setAppointments(formattedAppointments);
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
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate((prev) => addDays(prev, 1));
    } else if (view === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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
        console.error("Error confirmando cita");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: "confirmed" as const } : apt
          )
        );
        console.log("Cita confirmada y email enviado al paciente");
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  };

  const openCancelDialog = (appointment: Appointment) => {
    const patientName = appointment.patient?.name || "Paciente";
    setDialogState({
      isOpen: true,
      appointmentId: appointment.id,
      actionType: "cancel",
      appointmentDetails: {
        patientName: patientName,
        date: new Date(appointment.date).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: appointment.time.substring(0, 5),
        cost: appointment.cost || 0,
      },
    });
  };

  const openNoShowDialog = (appointment: Appointment) => {
    const patientName = appointment.patient?.name || "Paciente";
    setDialogState({
      isOpen: true,
      appointmentId: appointment.id,
      actionType: "no-show",
      appointmentDetails: {
        patientName: patientName,
        date: new Date(appointment.date).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: appointment.time.substring(0, 5),
        cost: appointment.cost || 0,
      },
    });
  };

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      appointmentId: null,
      actionType: null,
    });
  };

  const openRescheduleDialog = (appointment: Appointment) => {
    const patientName = appointment.patient?.name || "Paciente";
    setRescheduleDialogState({
      isOpen: true,
      appointmentId: appointment.id,
      currentDate: appointment.date,
      currentTime: appointment.time,
      appointmentDetails: {
        patientName: patientName,
        cost: appointment.cost || 0,
      },
    });
  };

  const closeRescheduleDialog = () => {
    setRescheduleDialogState({
      isOpen: false,
      appointmentId: null,
      currentDate: "",
      currentTime: "",
    });
  };

  const handleRescheduleSuccess = () => {
    closeRescheduleDialog();
    window.location.reload();
  };

  const handleDialogSuccess = () => {
    toast.success(
      dialogState.actionType === "cancel"
        ? "Cita cancelada exitosamente. El paciente recibirá un crédito."
        : "Inasistencia reportada exitosamente."
    );
    window.location.reload();
  };

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCreateSuccess = () => {
    toast.success("Cita creada exitosamente");
    window.location.reload();
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
    } else {
      return format(currentDate, "MMMM yyyy", { locale: es });
    }
  };

  // Renderizar vistas
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto_1fr] gap-0">
            {hours.map((hour) => {
              const appointmentsAtHour = getAppointmentsForDateAndTime(currentDate, hour);
              return (
                <div key={hour} className="contents">
                  <div className="text-xs text-muted-foreground pr-4 py-2 text-right sticky left-0 bg-background">
                    {format(new Date().setHours(hour, 0), "ha", { locale: es })}
                  </div>
                  <div className="border-t border-border py-2 min-h-[60px] relative">
                    {appointmentsAtHour.length > 0 && (
                      <div className="space-y-1">
                        {appointmentsAtHour.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => handleViewAppointment(apt)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity`}
                          >
                            <div className="font-semibold">{apt.patient.name}</div>
                            <div className="text-xs mt-1">
                              {apt.time} • {apt.duration} min
                            </div>
                            <div className="text-xs">{apt.type}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

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
                <div className="text-xs text-muted-foreground pr-2 py-2 text-right w-16 sticky left-0 bg-background border-r border-border">
                  {format(new Date().setHours(hour, 0), "ha", { locale: es })}
                </div>
                {weekDays.map((day, dayIdx) => {
                  const appointmentsAtHour = getAppointmentsForDateAndTime(day, hour);
                  return (
                    <div
                      key={dayIdx}
                      className={`border-t border-l border-border min-h-[60px] p-1 ${
                        isToday(day) ? "bg-primary/5" : ""
                      }`}
                    >
                      {appointmentsAtHour.length > 0 && (
                        <div className="space-y-1">
                          {appointmentsAtHour.map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => handleViewAppointment(apt)}
                              className={`w-full text-left px-2 py-1 rounded text-xs border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity`}
                            >
                              <div className="font-semibold truncate">
                                {apt.patient.name}
                              </div>
                              <div className="truncate">{apt.time}</div>
                            </button>
                          ))}
                        </div>
                      )}
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
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={dayIdx}
                    className={`min-h-[120px] border-r last:border-r-0 border-border p-2 ${
                      !isCurrentMonth ? "bg-muted/20" : ""
                    } ${isDayToday ? "bg-primary/5" : ""}`}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        !isCurrentMonth
                          ? "text-muted-foreground"
                          : isDayToday
                          ? "text-primary"
                          : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
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
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{dayAppointments.length - 3} más
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Calendario de Citas</h1>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
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
            <h2 className="text-lg font-semibold capitalize">{getTitle()}</h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-card border border-border rounded-lg overflow-hidden">
          {view === "day" && renderDayView()}
          {view === "week" && renderWeekView()}
          {view === "month" && renderMonthView()}
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

          {selectedAppointment && (
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
              </div>

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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {dialogState.isOpen && dialogState.appointmentId && dialogState.actionType && (
        <AppointmentActionsDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          appointmentId={dialogState.appointmentId}
          actionType={dialogState.actionType}
          userRole="professional"
          appointmentDetails={dialogState.appointmentDetails}
          onSuccess={handleDialogSuccess}
        />
      )}

      {rescheduleDialogState.isOpen && rescheduleDialogState.appointmentId && (
        <RescheduleAppointmentDialog
          isOpen={rescheduleDialogState.isOpen}
          onClose={closeRescheduleDialog}
          appointmentId={rescheduleDialogState.appointmentId}
          currentDate={rescheduleDialogState.currentDate}
          currentTime={rescheduleDialogState.currentTime}
          userRole="professional"
          appointmentDetails={rescheduleDialogState.appointmentDetails}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      <CreateAppointmentDialog
        isOpen={isCreateDialogOpen}
        onClose={handleCreateDialogClose}
        professionalId={professionalAppId}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
