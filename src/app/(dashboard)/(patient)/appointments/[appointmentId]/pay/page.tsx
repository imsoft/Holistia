"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaymentButton from "@/components/ui/payment-button";
import { formatPrice } from "@/lib/price-utils";

export default function PayAppointmentPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const userId = useUserId();
  const appointmentId = params.appointmentId as string;
  const supabase = createClient();

  const [appointment, setAppointment] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== userId) {
        setError("No tienes permisos para acceder a esta página");
        return;
      }

      // Get appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('patient_id', userId)
        .single();

      if (appointmentError || !appointmentData) {
        setError("Cita no encontrada");
        return;
      }

      // Check if appointment is already paid
      if (appointmentData.status === 'confirmed') {
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('appointment_id', appointmentId)
          .eq('status', 'succeeded');

        if (payments && payments.length > 0) {
          setError("Esta cita ya ha sido pagada");
          return;
        }
      }

      setAppointment(appointmentData);

      // Get professional details
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, profession, profile_photo, user_id')
        .eq('id', appointmentData.professional_id)
        .single();

      if (!professionalError && professionalData) {
        // Get professional avatar
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', professionalData.user_id)
          .single();

        setProfessional({
          ...professionalData,
          avatar_url: profileData?.avatar_url || professionalData.profile_photo,
        });
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError("Error al cargar los detalles de la cita");
    } finally {
      setLoading(false);
    }
  };

  // PaymentButton will redirect automatically on success
  // We'll handle errors via toast in useEffect if needed

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded w-48 mx-auto" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Cita no encontrada"}</p>
            <Button onClick={() => router.push(`/patient/${userId}/explore/appointments`)}>
              Volver a mis citas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const appointmentType = appointment.appointment_type === 'presencial' 
    ? 'Presencial' 
    : appointment.appointment_type === 'online' 
    ? 'En línea' 
    : appointment.appointment_type;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Pagar Cita</CardTitle>
            <CardDescription>
              Completa el pago para confirmar tu cita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Professional Info */}
            {professional && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {professional.avatar_url && (
                  <img
                    src={professional.avatar_url}
                    alt={professional.first_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {professional.first_name} {professional.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{professional.profession}</p>
                </div>
              </div>
            )}

            {/* Appointment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detalles de la Cita</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{appointmentDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hora</p>
                    <p className="font-medium">{appointment.appointment_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="font-medium">{appointment.duration_minutes} minutos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <Badge variant="outline">{appointmentType}</Badge>
                  </div>
                </div>
              </div>

              {appointment.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{appointment.location}</p>
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Total a Pagar</h3>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(appointment.cost, "MXN")}
                </p>
              </div>

              <PaymentButton
                appointmentId={appointment.id}
                serviceAmount={appointment.cost}
                professionalId={appointment.professional_id}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
