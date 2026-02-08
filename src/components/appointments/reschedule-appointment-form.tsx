"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import { useScheduleAvailability } from "@/hooks/use-schedule-availability";

interface RescheduleAppointmentFormProps {
  appointmentId: string;
  userRole: "patient" | "professional";
  redirectPath: string;
}

export function RescheduleAppointmentForm({
  appointmentId,
  userRole,
  redirectPath,
}: RescheduleAppointmentFormProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<{
    professionalName?: string;
    patientName?: string;
    cost: number;
  } | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const supabase = createClient();
  const { getTimeSlotsForDate } = useScheduleAvailability(professionalId || "");
  const [slots, setSlots] = useState<Array<{ time: string; display: string; status: string }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setIsLoading(true);

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          appointment_date,
          appointment_time,
          cost,
          patient_id,
          professional_id
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      setCurrentDate(appointment.appointment_date);
      setCurrentTime(appointment.appointment_time);
      setProfessionalId(appointment.professional_id);

      // Obtener nombres del profesional y paciente
      const { data: patient } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name')
        .eq('id', appointment.patient_id)
        .single();

      const { data: professional } = await supabase
        .from('professional_applications')
        .select('first_name, last_name')
        .eq('id', appointment.professional_id)
        .single();

      setAppointmentDetails({
        patientName: patient?.full_name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Paciente',
        professionalName: professional ? `${professional.first_name} ${professional.last_name}` : 'Profesional',
        cost: appointment.cost || 0,
      });

    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError('Error al cargar los detalles de la cita');
      toast.error('Error al cargar los detalles de la cita');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar slots disponibles cuando cambia la fecha elegida
  const loadSlotsForDate = useCallback(async (date: string) => {
    if (!professionalId || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSlots([]);
    setNewTime("");
    try {
      const timeSlots = await getTimeSlotsForDate(date, { excludeAppointmentId: appointmentId });
      const available = timeSlots.filter((s) => s.status === "available");
      setSlots(available.map((s) => ({ time: s.time, display: s.display, status: s.status })));
    } catch (err) {
      console.error("Error loading slots:", err);
      toast.error("Error al cargar horarios disponibles");
    } finally {
      setSlotsLoading(false);
    }
  }, [professionalId, appointmentId, getTimeSlotsForDate]);

  useEffect(() => {
    if (newDate) loadSlotsForDate(newDate);
    else setSlots([]);
  }, [newDate, loadSlotsForDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!newDate || !newTime) {
      setError("Por favor selecciona la nueva fecha y hora");
      return;
    }

    // Validar que la nueva fecha no sea en el pasado
    const selectedDateTime = new Date(`${newDate}T${newTime}`);
    const now = new Date();

    if (selectedDateTime <= now) {
      setError("La fecha y hora deben ser en el futuro");
      return;
    }

    // Validar que solo se pueda reprogramar hasta una hora antes de la cita
    const appointmentDateTime = new Date(`${currentDate}T${currentTime}`);
    const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000); // Restar 1 hora

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

      // Redirigir de vuelta
      router.push(redirectPath);
    } catch (err) {
      console.error("Error al reprogramar:", err);
      setError(
        err instanceof Error ? err.message : "Error al reprogramar la cita"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fecha mínima: hoy - evitar toISOString() que convierte a UTC y puede desplazar la fecha
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Formatear fecha actual para mostrar - parseo manual para evitar UTC shift
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 inline-block h-4 w-36 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">
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

          {/* Nueva fecha */}
          <div className="space-y-2">
            <Label htmlFor="newDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Nueva Fecha
            </Label>
            <Input
              id="newDate"
              type="date"
              value={newDate || ""}
              onChange={(e) => setNewDate(e.target.value)}
              min={minDate}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Nueva hora: solo slots reales disponibles */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Nueva Hora
            </Label>
            {!newDate ? (
              <p className="text-sm text-muted-foreground">
                Elige primero una fecha para ver los horarios disponibles.
              </p>
            ) : slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando horarios disponibles...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay horarios disponibles ese día. Elige otra fecha.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.time}
                    type="button"
                    variant={newTime === slot.time ? "default" : "outline"}
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setNewTime(slot.time)}
                  >
                    {slot.display}
                  </Button>
                ))}
              </div>
            )}
          </div>

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
              className="w-full min-h-[100px]"
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
                pago de {formatPrice(appointmentDetails.cost, "MXN")} sigue siendo válido para
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

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newDate || !newTime}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Reprogramando..." : "Confirmar Reprogramación"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
