"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useScheduleAvailability } from "@/hooks/use-schedule-availability";
import { formatLocalDate } from "@/lib/date-utils";

interface RescheduleAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  professionalId: string;
  currentDate: string;
  currentTime: string;
  userRole: "patient" | "professional";
  appointmentDetails?: {
    professionalName?: string;
    patientName?: string;
    cost: number;
  };
  onSuccess?: () => void;
}

export function RescheduleAppointmentDialog({
  isOpen,
  onClose,
  appointmentId,
  professionalId,
  currentDate,
  currentTime,
  userRole,
  appointmentDetails,
  onSuccess,
}: RescheduleAppointmentDialogProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; display: string; status: string }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [datesLoading, setDatesLoading] = useState(false);

  const { loadWeekAvailability, getTimeSlotsForDate } = useScheduleAvailability(professionalId);

  // Cargar fechas con disponibilidad al abrir el dialog
  useEffect(() => {
    if (!isOpen || !professionalId) return;

    const loadAvailableDates = async () => {
      setDatesLoading(true);
      try {
        const dates = new Set<string>();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Cargar 4 semanas de disponibilidad
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() + week * 7);
          const weekData = await loadWeekAvailability(weekStart, {
            excludeAppointmentId: appointmentId,
          });
          for (const day of weekData) {
            const hasAvailable = day.timeSlots.some(s => s.status === "available");
            if (hasAvailable) {
              dates.add(day.date);
            }
          }
        }
        setAvailableDates(dates);
      } catch {
        console.error("Error cargando fechas disponibles");
      } finally {
        setDatesLoading(false);
      }
    };

    loadAvailableDates();
  }, [isOpen, professionalId, appointmentId, loadWeekAvailability]);

  // Cargar slots cuando se selecciona una fecha
  const loadSlotsForDate = useCallback(async (date: string) => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    setAvailableSlots([]);
    setNewTime("");
    try {
      const timeSlots = await getTimeSlotsForDate(date, {
        excludeAppointmentId: appointmentId,
      });
      const available = timeSlots.filter(s => s.status === "available");
      setAvailableSlots(available);
    } catch {
      toast.error("Error al cargar horarios disponibles");
    } finally {
      setSlotsLoading(false);
    }
  }, [getTimeSlotsForDate, appointmentId]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = formatLocalDate(date);
    setNewDate(dateStr);
    loadSlotsForDate(dateStr);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!newDate || !newTime) {
      setError("Por favor selecciona la nueva fecha y hora");
      return;
    }

    // Validar que la nueva fecha no sea en el pasado — parseo manual para evitar UTC shift
    const [selY, selM, selD] = newDate.split('-').map(Number);
    const [selH, selMin] = newTime.split(':').map(Number);
    const selectedDateTime = new Date(selY, selM - 1, selD, selH, selMin);
    const now = new Date();

    if (selectedDateTime <= now) {
      setError("La fecha y hora deben ser en el futuro");
      return;
    }

    // Validar que solo se pueda reprogramar hasta una hora antes de la cita
    const [curY, curM, curD] = currentDate.split('-').map(Number);
    const curTimeParts = currentTime.split(':').map(Number);
    const appointmentDateTime = new Date(curY, curM - 1, curD, curTimeParts[0], curTimeParts[1]);
    const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);

    if (now >= oneHourBefore) {
      setError("Solo puedes reprogramar una cita hasta una hora antes de la fecha y hora programada");
      return;
    }

    // Validar que la nueva fecha sea diferente a la actual
    if (newDate === currentDate && newTime === currentTime) {
      setError("La nueva fecha y hora deben ser diferentes a la actual");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/appointments/reschedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId,
          newDate,
          newTime,
          rescheduledBy: userRole,
          rescheduleReason: rescheduleReason.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al reprogramar la cita");
      }

      toast.success("Cita reprogramada exitosamente");
      toast.info("Se han enviado correos de notificación a ambas partes");

      // Resetear formulario
      setNewDate("");
      setNewTime("");
      setAvailableSlots([]);
      setRescheduleReason("");
      setError(null);

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      // Cerrar diálogo
      onClose();
    } catch (err) {
      console.error("Error al reprogramar:", err);
      setError(
        err instanceof Error ? err.message : "Error al reprogramar la cita"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewDate("");
      setNewTime("");
      setAvailableSlots([]);
      setRescheduleReason("");
      setError(null);
      onClose();
    }
  };

  // Fecha mínima: mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Parsear newDate para el Calendar component
  const selectedCalendarDate = newDate
    ? (() => { const [y, m, d] = newDate.split('-').map(Number); return new Date(y, m - 1, d); })()
    : undefined;

  // Formatear fecha actual para mostrar — parseo manual para evitar UTC shift
  const formatDateLocal = (dateStr: string) => {
    if (!dateStr) return "No especificada";
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return "Fecha inválida";
      const [y, m, d] = parts.map(Number);
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  // Formatear hora para mostrar
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "No especificada";
    if (timeStr.includes(':') && timeStr.split(':').length === 3) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Reprogramar Cita
          </DialogTitle>
          <DialogDescription>
            Selecciona la nueva fecha y hora para tu cita
            {appointmentDetails?.professionalName &&
              ` con ${appointmentDetails.professionalName}`}
            {appointmentDetails?.patientName &&
              userRole === "professional" &&
              ` con ${appointmentDetails.patientName}`}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fecha y hora actual */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2">Fecha y Hora Actual</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Fecha:</p>
                <p className="font-medium">{formatDateLocal(currentDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hora:</p>
                <p className="font-medium">{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>

          {/* Nueva fecha — calendario visual */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Nueva Fecha
            </Label>
            {datesLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando disponibilidad...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedCalendarDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    if (date < tomorrow) return true;
                    const dateStr = formatLocalDate(date);
                    return !availableDates.has(dateStr);
                  }}
                  fromDate={tomorrow}
                  className="rounded-md border"
                />
              </div>
            )}
            {newDate && (
              <p className="text-sm text-center font-medium">
                {formatDateLocal(newDate)}
              </p>
            )}
          </div>

          {/* Nueva hora — botones de slots disponibles */}
          {newDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Nueva Hora
              </Label>
              {slotsLoading ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando horarios...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay horarios disponibles para esta fecha.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={newTime === slot.time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewTime(slot.time)}
                      disabled={isSubmitting}
                      className="text-sm"
                    >
                      {slot.display}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Razón de reprogramación (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="rescheduleReason">
              Razón de reprogramación (opcional)
            </Label>
            <Textarea
              id="rescheduleReason"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full min-h-[80px]"
              placeholder="Explica brevemente por qué necesitas reprogramar esta cita..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {rescheduleReason.length}/500 caracteres
            </p>
          </div>

          {/* Advertencia */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Al reprogramar, se enviará una notificación por correo
              electrónico a{" "}
              {userRole === "patient"
                ? "el profesional"
                : "el paciente"}{" "}
              informando del cambio de fecha.
            </AlertDescription>
          </Alert>

          {/* Costo */}
          {appointmentDetails?.cost && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> No se realizarán cargos adicionales. El
                pago de ${appointmentDetails.cost} MXN sigue siendo válido para
                la nueva fecha.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newDate || !newTime}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Reprogramando..." : "Confirmar Reprogramación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
