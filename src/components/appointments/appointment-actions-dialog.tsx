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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Ban, UserX, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppointmentActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  actionType: 'cancel' | 'no-show';
  userRole: 'patient' | 'professional';
  appointmentDetails?: {
    professionalName?: string;
    patientName?: string;
    date: string;
    time: string;
    cost: number;
  };
  onSuccess?: () => void;
}

export function AppointmentActionsDialog({
  isOpen,
  onClose,
  appointmentId,
  actionType,
  userRole,
  appointmentDetails,
  onSuccess
}: AppointmentActionsDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validar que si es cancelación por paciente, debe tener razón
      if (actionType === 'cancel' && userRole === 'patient' && !reason.trim()) {
        setError('Debes proporcionar una razón para cancelar la cita');
        setIsSubmitting(false);
        return;
      }

      const endpoint = actionType === 'cancel'
        ? '/api/appointments/cancel'
        : '/api/appointments/mark-no-show';

      const body = actionType === 'cancel'
        ? {
            appointmentId,
            cancelledBy: userRole,
            cancellationReason: reason || undefined
          }
        : {
            appointmentId,
            markedBy: userRole,
            noShowDescription: reason || undefined
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      // Reset form
      setReason("");
      onClose();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDialogContent = () => {
    if (actionType === 'cancel') {
      const isPatient = userRole === 'patient';
      return {
        title: "Cancelar cita",
        icon: <Ban className="h-6 w-6 text-red-600" />,
        description: isPatient
          ? `Estás a punto de cancelar tu cita con ${appointmentDetails?.professionalName || 'el profesional'}.`
          : `Estás a punto de cancelar la cita con ${appointmentDetails?.patientName || 'el paciente'}.`,
        inputLabel: isPatient ? "Razón de la cancelación (requerido)" : "Razón de la cancelación (opcional)",
        inputPlaceholder: "Comparte el motivo de tu cancelación...",
        warningMessage: isPatient
          ? "Recibirás un crédito de $" + (appointmentDetails?.cost || 0) + " MXN para usar en tu próxima cita con este profesional."
          : "El paciente recibirá un crédito de $" + (appointmentDetails?.cost || 0) + " MXN para usar en su próxima cita contigo.",
        confirmText: "Cancelar cita",
        confirmVariant: "destructive" as const
      };
    } else {
      const isPatientNoShow = userRole === 'professional';
      return {
        title: isPatientNoShow ? "Marcar paciente no se presentó" : "Marcar profesional no se presentó",
        icon: <UserX className="h-6 w-6 text-orange-600" />,
        description: isPatientNoShow
          ? `Vas a marcar que ${appointmentDetails?.patientName || 'el paciente'} no se presentó a la cita.`
          : `Vas a marcar que ${appointmentDetails?.professionalName || 'el profesional'} no se presentó a la cita.`,
        inputLabel: "Descripción de lo sucedido (opcional)",
        inputPlaceholder: "Describe qué sucedió...",
        warningMessage: isPatientNoShow
          ? "Se notificará al paciente sobre este reporte."
          : "Recibirás un crédito de $" + (appointmentDetails?.cost || 0) + " MXN como compensación.",
        confirmText: "Confirmar inasistencia",
        confirmVariant: "default" as const
      };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {content.icon}
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {appointmentDetails && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">{appointmentDetails.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hora:</span>
                <span className="font-medium">{appointmentDetails.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-medium">${appointmentDetails.cost} MXN</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{content.inputLabel}</Label>
            <Textarea
              id="reason"
              placeholder={content.inputPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {content.warningMessage}
            </AlertDescription>
          </Alert>

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
            onClick={onClose}
            disabled={isSubmitting}
          >
            Volver
          </Button>
          <Button
            variant={content.confirmVariant}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {content.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
