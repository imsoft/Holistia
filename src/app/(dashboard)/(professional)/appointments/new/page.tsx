"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Loader2, AlertCircle, User, FileText, Search, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Patient {
  patient_id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  modality: string;
  duration: number;
  cost: number;
}

export default function NewAppointmentPage() {
  useUserStoreInit();
  const router = useRouter();
  const professionalId = useUserId();

  const [patients, setPatients] = useState<(Patient & { isExisting?: boolean })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadPatientsAndServices();
  }, [professionalId]);

  const loadPatientsAndServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar pacientes que ya han tenido citas con el profesional
      const { data: patientsData, error: patientsError } = await supabase
        .from('professional_patient_info')
        .select('patient_id, full_name, email, phone')
        .eq('professional_id', professionalId)
        .order('full_name', { ascending: true });

      if (patientsError) {
        console.error('Error cargando pacientes:', patientsError);
      }

      // Cargar TODOS los pacientes registrados en Holistia
      const { data: allPatientsData, error: allPatientsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, first_name, last_name')
        .eq('type', 'patient')
        .eq('account_active', true)
        .order('full_name', { ascending: true });

      if (allPatientsError) {
        console.error('Error cargando todos los pacientes:', allPatientsError);
        setError('Error al cargar la lista de pacientes');
        return;
      }

      // Convertir formato de profiles a formato de Patient
      const formattedAllPatients = (allPatientsData || []).map(profile => ({
        patient_id: profile.id,
        full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Paciente',
        email: profile.email || '',
        phone: profile.phone || null,
      }));

      // Marcar cuáles pacientes ya han tenido citas
      const existingPatientIds = new Set((patientsData || []).map(p => p.patient_id));
      const patientsWithStatus = formattedAllPatients.map(patient => ({
        ...patient,
        isExisting: existingPatientIds.has(patient.patient_id),
      }));

      setPatients(patientsWithStatus);

      // Cargar servicios activos del profesional
      const { data: servicesData, error: servicesError } = await supabase
        .from('professional_services')
        .select('id, name, description, modality, duration, cost')
        .eq('professional_id', professionalId)
        .eq('isactive', true)
        .order('name', { ascending: true });

      if (servicesError) {
        console.error('Error cargando servicios:', servicesError);
        setError('Error al cargar los servicios');
        return;
      }

      setServices(servicesData || []);

      if (servicesData?.length === 0) {
        setError('No tienes servicios activos. Por favor configura tus servicios primero.');
      }

    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!selectedPatientId || !selectedServiceId || !appointmentDate || !appointmentTime) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar que la fecha no sea en el pasado
    const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();

    if (selectedDateTime <= now) {
      setError("La fecha y hora deben ser en el futuro");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Obtener información del servicio seleccionado
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (!selectedService) {
        throw new Error("Servicio no encontrado");
      }

      // Verificar que no exista una cita duplicada
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', selectedPatientId)
        .eq('professional_id', professionalId)
        .eq('appointment_date', appointmentDate)
        .eq('appointment_time', appointmentTime)
        .maybeSingle();

      if (existingAppointment) {
        setError("Ya existe una cita para este paciente en esta fecha y hora");
        setIsSubmitting(false);
        return;
      }

      // Verificar bloqueos de disponibilidad
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId);

      if (blocks && blocks.length > 0) {
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const appointmentDateObj = new Date(year, month - 1, day);
        const dayOfWeek = appointmentDateObj.getDay() === 0 ? 7 : appointmentDateObj.getDay();

        const isBlocked = blocks.some(block => {
          const blockStartDate = new Date(block.start_date);
          const blockEndDate = block.end_date ? new Date(block.end_date) : blockStartDate;
          const currentDate = new Date(appointmentDate);

          blockStartDate.setHours(0, 0, 0, 0);
          blockEndDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);

          if (block.block_type === 'full_day' || block.block_type === 'weekly_day') {
            if (block.is_recurring && block.day_of_week === dayOfWeek) {
              return true;
            }
            if (currentDate >= blockStartDate && currentDate <= blockEndDate) {
              return true;
            }
          }

          if ((block.block_type === 'time_range' || block.block_type === 'weekly_range') &&
              block.start_time && block.end_time) {
            const isInDateRange = currentDate >= blockStartDate && currentDate <= blockEndDate;

            if (block.is_recurring || isInDateRange) {
              if (appointmentTime >= block.start_time && appointmentTime < block.end_time) {
                return true;
              }
            }
          }

          return false;
        });

        if (isBlocked) {
          setError("Este horario no está disponible. Puede estar bloqueado por un evento en tu calendario.");
          setIsSubmitting(false);
          return;
        }
      }

      // Crear la cita con estado 'pending'
      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: selectedPatientId,
          professional_id: professionalId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_minutes: selectedService.duration,
          appointment_type: selectedService.modality,
          cost: selectedService.cost,
          location: selectedService.modality === 'online' ? 'Online' : null,
          notes: notes.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creando cita:', insertError);
        throw new Error(insertError.message);
      }

      console.log('✅ Cita creada exitosamente:', newAppointment);

      // Sincronizar con Google Calendar
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        try {
          const syncResponse = await fetch('/api/google-calendar/sync-appointment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              appointmentId: newAppointment.id,
              userId: user.id
            })
          });

          if (!syncResponse.ok) {
            console.log('⚠️ No se pudo sincronizar con Google Calendar');
          } else {
            console.log('✅ Cita sincronizada con Google Calendar');
          }
        } catch (syncError) {
          console.error('Error sincronizando con Google Calendar:', syncError);
        }
      }

      // Generar enlace de pago
      const paymentUrl = `${window.location.origin}/patient/${selectedPatientId}/appointments/${newAppointment.id}/pay`;

      // Enviar email al paciente
      try {
        const patient = patients.find(p => p.patient_id === selectedPatientId);
        const response = await fetch('/api/appointments/send-creation-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: newAppointment.id,
            paymentUrl: paymentUrl
          })
        });

        if (response.ok) {
          toast.success("Cita creada exitosamente");
          toast.info(`Se ha enviado un email a ${patient?.full_name} con la información de la cita y el enlace de pago.`);
        } else {
          toast.success("Cita creada exitosamente");
          toast.warning("No se pudo enviar el email al paciente. La cita está pendiente de pago.");
        }
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        toast.success("Cita creada exitosamente");
        toast.warning("No se pudo enviar el email al paciente. La cita está pendiente de pago.");
      }

      // Redirigir de vuelta a la página de citas
      router.push(`/professional/${professionalId}/appointments`);
    } catch (err) {
      console.error("Error al crear cita:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear la cita"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Obtener información del servicio seleccionado
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Crear Nueva Cita
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea una cita manual para uno de tus pacientes
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando datos...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Seleccionar Paciente */}
                  <div className="space-y-2">
                    <Label htmlFor="patient" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Paciente *
                    </Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar paciente por nombre o email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Select
                        value={selectedPatientId}
                        onValueChange={setSelectedPatientId}
                        disabled={isSubmitting || patients.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un paciente" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {patients
                            .filter(patient => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              return (
                                patient.full_name.toLowerCase().includes(query) ||
                                patient.email.toLowerCase().includes(query)
                              );
                            })
                            .map((patient) => (
                              <SelectItem key={patient.patient_id} value={patient.patient_id}>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span>{patient.full_name}</span>
                                    {(patient as any).isExisting && (
                                      <Badge variant="secondary" className="text-xs">Paciente existente</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{patient.email}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Puedes seleccionar pacientes que ya han tenido citas contigo o cualquier paciente registrado en Holistia.
                    </p>
                  </div>

                  {/* Seleccionar Servicio */}
                  <div className="space-y-2">
                    <Label htmlFor="service" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Servicio *
                    </Label>
                    <Select
                      value={selectedServiceId}
                      onValueChange={setSelectedServiceId}
                      disabled={isSubmitting || services.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex flex-col">
                              <span>{service.name} - {service.modality === 'online' ? 'Online' : 'Presencial'}</span>
                              <span className="text-xs text-muted-foreground">
                                {service.duration} min - ${service.cost} MXN
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedService && (
                      <div className="bg-muted/50 p-3 rounded-lg text-sm">
                        <p className="font-medium">{selectedService.name}</p>
                        {selectedService.description && (
                          <div
                            className="text-muted-foreground mt-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedService.description }}
                          />
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>⏱️ {selectedService.duration} minutos</span>
                          <span>💰 ${selectedService.cost} MXN</span>
                          <span>📍 {selectedService.modality === 'online' ? 'Online' : 'Presencial'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fecha *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={minDate}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  {/* Hora */}
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora *
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Hora de inicio de la cita
                    </p>
                  </div>

                  {/* Notas */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notas (opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Agregar notas o instrucciones especiales para esta cita..."
                      disabled={isSubmitting}
                      rows={3}
                      className="w-full resize-none"
                    />
                  </div>

                  {/* Información */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      La cita se creará con estado <strong>confirmada</strong> y se enviará una notificación por email al paciente.
                      No se procesará ningún pago.
                    </AlertDescription>
                  </Alert>

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
                      disabled={
                        isSubmitting ||
                        !selectedPatientId ||
                        !selectedServiceId ||
                        !appointmentDate ||
                        !appointmentTime ||
                        patients.length === 0 ||
                        services.length === 0
                      }
                      className="flex-1"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? "Creando..." : "Crear Cita"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
