"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<{
    professionalName?: string;
    patientName?: string;
    cost: number;
  } | null>(null);

  const supabase = createClient();

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

  // Obtener fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Formatear fecha actual para mostrar
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "No especificada";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
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
        <span className="ml-2 text-sm text-muted-foreground">Cargando detalles de la cita...</span>
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
                <p className="font-medium">{formatDate(currentDate)}</p>
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

          {/* Nueva hora */}
          <div className="space-y-2">
            <Label htmlFor="newTime" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Nueva Hora
            </Label>
            <Input
              id="newTime"
              type="time"
              value={newTime || ""}
              onChange={(e) => setNewTime(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
              placeholder="--:--"
            />
            <p className="text-xs text-muted-foreground">
              * Selecciona la hora de inicio de la cita
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
