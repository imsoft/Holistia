"use client";

import { useState, useEffect, useCallback } from "react";
import { useScheduleAvailability } from "@/hooks/use-schedule-availability";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Loader2, AlertCircle, User, FileText, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";

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

interface CreateAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  onSuccess?: () => void;
}

export function CreateAppointmentDialog({
  isOpen,
  onClose,
  professionalId,
  onSuccess,
}: CreateAppointmentDialogProps) {
  const [patients, setPatients] = useState<(Patient & { isExisting?: boolean })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; display: string; status: string }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const supabase = createClient();
  const { getTimeSlotsForDate } = useScheduleAvailability(professionalId);

  // Cargar slots disponibles cuando cambia la fecha
  const loadSlotsForDate = useCallback(async (date: string) => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    setAvailableSlots([]);
    setAppointmentTime("");
    try {
      const timeSlots = await getTimeSlotsForDate(date);
      const available = timeSlots.filter(s => s.status === "available");
      setAvailableSlots(available);
    } catch {
      toast.error("Error al cargar horarios disponibles");
    } finally {
      setSlotsLoading(false);
    }
  }, [getTimeSlotsForDate]);

  // Cargar pacientes y servicios cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      loadPatientsAndServices();
    }
  }, [isOpen, professionalId]);

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
        // No retornar aquí, continuar para cargar todos los pacientes
      }

      // Cargar TODOS los pacientes registrados en Holistia (para permitir crear citas a pacientes nuevos)
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

      // Marcar cuáles pacientes ya han tenido citas (para mostrar badge)
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

      // No mostrar error si no hay pacientes existentes, ya que ahora pueden seleccionar cualquier paciente registrado

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

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedPatientId || !selectedServiceId || !appointmentDate || !appointmentTime) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar que la fecha no sea en el pasado — parseo manual para evitar UTC shift
    const [selY, selM, selD] = appointmentDate.split('-').map(Number);
    const [selH, selMin] = appointmentTime.split(':').map(Number);
    const selectedDateTime = new Date(selY, selM - 1, selD, selH, selMin);
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

      // Verificar que no exista una cita en el mismo horario ni solapamiento (de cualquier paciente)
      const { data: existingOnDate } = await supabase
        .from('appointments')
        .select('id, appointment_time, duration_minutes')
        .eq('professional_id', professionalId)
        .eq('appointment_date', appointmentDate)
        .not('status', 'eq', 'cancelled');

      const exactMatch = existingOnDate?.find(
        (a) => a.appointment_time === appointmentTime || String(a.appointment_time).slice(0, 5) === appointmentTime.slice(0, 5)
      );
      if (exactMatch) {
        setError("Ya existe una cita en esta fecha y hora. Por favor elige otro horario.");
        setIsSubmitting(false);
        return;
      }

      const { slotsOverlap } = await import('@/lib/appointment-conflict');
      if (existingOnDate?.length && slotsOverlap(
        { appointment_time: appointmentTime, duration_minutes: selectedService.duration },
        existingOnDate.map((a) => ({ appointment_time: String(a.appointment_time), duration_minutes: a.duration_minutes ?? 50 }))
      )) {
        setError("Este horario se solapa con otra cita. Por favor elige otro horario.");
        setIsSubmitting(false);
        return;
      }

      // Verificar que el horario no esté bloqueado usando lógica compartida (lib/availability.ts)
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId);

      if (blocks && blocks.length > 0) {
        // Usar la función compartida isSlotBlocked (misma lógica que hook y checkout)
        const { isSlotBlocked } = await import('@/lib/availability');
        const timeNorm = appointmentTime.substring(0, 5);

        if (isSlotBlocked(appointmentDate, timeNorm, blocks, selectedService.duration)) {
          setError("Este horario no está disponible. Puede estar bloqueado por un evento en tu calendario.");
          setIsSubmitting(false);
          return;
        }
      }

      // Verificar que el día sea laboral y la hora esté dentro del horario
      const { data: profHours } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days')
        .eq('id', professionalId)
        .single();

      if (profHours) {
        const { isWorkingDay, isWithinWorkingHours } = await import('@/lib/availability');
        const workingDays = profHours.working_days?.length ? profHours.working_days : [1, 2, 3, 4, 5];

        if (!isWorkingDay(appointmentDate, workingDays)) {
          setError("Este día no es un día laboral del profesional.");
          setIsSubmitting(false);
          return;
        }

        const startTime = profHours.working_start_time || '09:00';
        const endTime = profHours.working_end_time || '18:00';
        const timeNorm = appointmentTime.substring(0, 5);

        if (!isWithinWorkingHours(timeNorm, startTime, endTime)) {
          setError("Este horario está fuera del horario laboral del profesional.");
          setIsSubmitting(false);
          return;
        }
      }

      // Crear la cita con estado 'pending' para que requiera pago
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
          status: 'pending', // Estado pendiente hasta que el paciente pague
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creando cita:', insertError);
        if (insertError.code === '23505') {
          setError("Este horario ya no está disponible. Por favor elige otro horario.");
          setIsSubmitting(false);
          return;
        }
        throw new Error(insertError.message);
      }

      console.log('✅ Cita creada exitosamente:', newAppointment);

      // Obtener el user_id del profesional para sincronizar con Google Calendar
      const { data: { user } } = await supabase.auth.getUser();

      // Sincronizar con Google Calendar si el profesional tiene Google Calendar conectado
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
            console.log('⚠️ No se pudo sincronizar con Google Calendar (puede que no esté conectado)');
          } else {
            console.log('✅ Cita sincronizada con Google Calendar');
          }
        } catch (syncError) {
          console.error('Error sincronizando con Google Calendar:', syncError);
          // No mostramos error al usuario porque no es crítico
        }
      }

      // Generar enlace de pago para la cita
      const paymentUrl = `${window.location.origin}/patient/${selectedPatientId}/appointments/${newAppointment.id}/pay`;

      // Enviar email al paciente con enlace de pago
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
          const errorData = await response.json();
          console.error('Error sending email:', errorData);
          toast.success("Cita creada exitosamente");
          toast.warning("No se pudo enviar el email al paciente. La cita está pendiente de pago.");
        }
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        toast.success("Cita creada exitosamente");
        toast.warning("No se pudo enviar el email al paciente. La cita está pendiente de pago.");
      }

      // Resetear formulario
      setSelectedPatientId("");
      setSelectedServiceId("");
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");
      setError(null);

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      // Cerrar diálogo
      onClose();
    } catch (err) {
      console.error("Error al crear cita:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear la cita"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedPatientId("");
      setSelectedServiceId("");
      setAppointmentDate("");
      setAppointmentTime("");
      setAvailableSlots([]);
      setNotes("");
      setError(null);
      onClose();
    }
  };

  // Obtener fecha mínima (mañana) - evitar toISOString() que convierte a UTC
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  // Obtener información del servicio seleccionado
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Crear Nueva Cita
          </DialogTitle>
          <DialogDescription>
            Crea una cita manual para uno de tus pacientes. La cita se confirmará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mensaje de carga */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 inline-block h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          )}

          {!isLoading && (
            <>
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
                            {service.duration} min - {formatPrice(service.cost, "MXN")}
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
                      <span className="whitespace-nowrap">💰 {formatPrice(selectedService.cost, "MXN")}</span>
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setAppointmentDate(val);
                    loadSlotsForDate(val);
                  }}
                  min={minDate}
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>

              {/* Hora — botones de slots disponibles */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hora *
                </Label>
                {!appointmentDate ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Selecciona primero una fecha para ver los horarios disponibles.
                  </p>
                ) : slotsLoading ? (
                  <div className="flex items-center gap-2 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Cargando horarios disponibles...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hay horarios disponibles para esta fecha. Intenta con otra fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        type="button"
                        variant={appointmentTime === slot.time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAppointmentTime(slot.time)}
                        disabled={isSubmitting}
                        className="text-sm"
                      >
                        {slot.display}
                      </Button>
                    ))}
                  </div>
                )}
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
            </>
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
            disabled={
              isSubmitting ||
              isLoading ||
              !selectedPatientId ||
              !selectedServiceId ||
              !appointmentDate ||
              !appointmentTime ||
              patients.length === 0 ||
              services.length === 0
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creando..." : "Crear Cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
