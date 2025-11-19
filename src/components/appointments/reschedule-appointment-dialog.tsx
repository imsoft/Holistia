"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface RescheduleAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
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
  currentDate,
  currentTime,
  userRole,
  appointmentDetails,
  onSuccess,
}: RescheduleAppointmentDialogProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
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

      // Resetear formulario
      setNewDate("");
      setNewTime("");
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
      setError(null);
      onClose();
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
    // Si viene con segundos (HH:MM:SS), tomar solo HH:MM
    if (timeStr.includes(':') && timeStr.split(':').length === 3) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
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
