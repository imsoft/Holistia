"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Ban, UserX, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface AppointmentActionFormProps {
  appointmentId: string;
  actionType: 'cancel' | 'no-show';
  userRole: 'patient' | 'professional';
  redirectPath: string;
}

interface AppointmentDetails {
  professionalName?: string;
  patientName?: string;
  date: string;
  time: string;
  cost: number;
}

export function AppointmentActionForm({
  appointmentId,
  actionType,
  userRole,
  redirectPath,
}: AppointmentActionFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          cost,
          patient_applications!appointments_patient_id_fkey(
            first_name,
            last_name
          ),
          professional_applications!appointments_professional_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq("id", appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      const professionalData = Array.isArray(appointment.professional_applications)
        ? appointment.professional_applications[0]
        : appointment.professional_applications;
      const patientData = Array.isArray(appointment.patient_applications)
        ? appointment.patient_applications[0]
        : appointment.patient_applications;

      setAppointmentDetails({
        professionalName: professionalData
          ? `${professionalData.first_name} ${professionalData.last_name}`
          : undefined,
        patientName: patientData
          ? `${patientData.first_name} ${patientData.last_name}`
          : undefined,
        date: new Date(appointment.scheduled_date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: appointment.scheduled_time,
        cost: appointment.cost,
      });
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Error al cargar los detalles de la cita");
      router.push(redirectPath);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const successMessage = actionType === 'cancel'
        ? 'Cita cancelada exitosamente'
        : 'Inasistencia registrada exitosamente';

      toast.success(successMessage);
      router.push(redirectPath);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormContent = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando detalles de la cita...</p>
        </div>
      </div>
    );
  }

  if (!appointmentDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">No se encontraron los detalles de la cita</p>
      </div>
    );
  }

  const content = getFormContent();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {content.icon}
            <h2 className="text-xl font-semibold">{content.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {content.description}
          </p>

          <div className="space-y-6">
            {/* Appointment Details */}
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

            {/* Reason Input */}
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

            {/* Warning Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {content.warningMessage}
              </AlertDescription>
            </Alert>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(redirectPath)}
          disabled={isSubmitting}
        >
          Volver
        </Button>
        <Button
          type="submit"
          variant={content.confirmVariant}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {content.confirmText}
        </Button>
      </div>
    </form>
  );
}
