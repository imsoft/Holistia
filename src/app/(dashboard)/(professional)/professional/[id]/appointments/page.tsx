"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  CalendarClock,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Filter,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";


export default function ProfessionalAppointments() {
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    actionType: 'cancel' | 'no-show' | null;
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
    currentDate: '',
    currentTime: '',
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Obtener la aplicación profesional del usuario
        const { data: professionalApp, error: profError } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (profError) {
          console.error('❌ Error obteniendo profesional:', profError);
          console.error('❌ Detalles del error:', {
            message: profError.message,
            details: profError.details,
            hint: profError.hint,
            code: profError.code
          });
          return;
        }

        if (!professionalApp) {
          console.error('❌ No se encontró aplicación profesional aprobada para user_id:', userId);
          return;
        }

        console.log('✅ Professional app ID:', professionalApp.id);
        console.log('🔍 Buscando citas con professional_id:', professionalApp.id);

        // Obtener todas las citas del profesional con información de pagos
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
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
          `)
          .eq('professional_id', professionalApp.id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (appointmentsError) {
          console.error('❌ Error obteniendo citas:', appointmentsError);
          console.error('❌ Detalles del error:', {
            message: appointmentsError.message,
            details: appointmentsError.details,
            hint: appointmentsError.hint,
            code: appointmentsError.code
          });
          return;
        }

        console.log('📊 Appointments found:', appointmentsData?.length || 0);
        if (appointmentsData && appointmentsData.length > 0) {
          console.log('📋 Primera cita encontrada:', appointmentsData[0]);
        }

        if (!appointmentsData || appointmentsData.length === 0) {
          setAppointments([]);
          setAvailableDates([]);
          return;
        }

        // Obtener fechas únicas para el filtro
        const uniqueDates = [...new Set(appointmentsData.map(apt => apt.appointment_date))];
        setAvailableDates(uniqueDates);

        // Obtener información de los pacientes usando la vista segura
        const patientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
        
        const { data: patientsData, error: patientsError } = await supabase
          .from('professional_patient_info')
          .select('patient_id, full_name, phone, email')
          .eq('professional_id', professionalApp.id)
          .in('patient_id', patientIds);

        if (patientsError) {
          console.error('Error obteniendo información de pacientes:', patientsError);
          console.error('Detalles:', {
            message: patientsError.message,
            details: patientsError.details,
            hint: patientsError.hint,
            code: patientsError.code
          });
        }

        console.log('👥 Pacientes encontrados:', patientsData?.length || 0);

        // Obtener información de pagos para todas las citas
        const appointmentIds = appointmentsData.map(apt => apt.id);
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('appointment_id, status, amount')
          .in('appointment_id', appointmentIds);

        console.log('💳 Pagos encontrados:', paymentsData?.length || 0);

        // Formatear citas con información de pacientes y pagos
        const formattedAppointments: Appointment[] = appointmentsData.map(apt => {
          const patient = patientsData?.find(p => p.patient_id === apt.patient_id);
          
          // Verificar si tiene algún pago exitoso
          const hasSuccessfulPayment = paymentsData?.some(
            p => p.appointment_id === apt.id && p.status === 'succeeded'
          ) || false;
          
          return {
            id: apt.id,
            patient: {
              name: patient?.full_name || `Paciente`,
              email: patient?.email || 'No disponible',
              phone: patient?.phone || 'No disponible',
            },
            date: apt.appointment_date,
            time: apt.appointment_time.substring(0, 5),
            duration: apt.duration_minutes,
            type: apt.appointment_type === 'presencial' ? 'Presencial' : 'Online',
            status: apt.status as "confirmed" | "pending" | "cancelled" | "completed",
            location: apt.location || (apt.appointment_type === 'online' ? 'Online' : 'Sin especificar'),
            notes: apt.notes || undefined,
            isPaid: hasSuccessfulPayment, // Nuevo campo
          };
        });

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = appointment.patient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const matchesDate = dateFilter === "all" || appointment.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Función para ver detalles de la cita
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  // Función para confirmar una cita - usa el endpoint API que envía email al paciente
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId })
      });

      if (!response.ok) {
        console.error('Error confirmando cita');
        return;
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar el estado local
        setAppointments(prev =>
          prev.map(apt =>
            apt.id === appointmentId
              ? { ...apt, status: 'confirmed' as const }
              : apt
          )
        );
        console.log('Cita confirmada y email enviado al paciente');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  // Función para crear nueva cita
  const handleCreateAppointment = () => {
    // Aquí podrías abrir un modal o navegar a una página de creación
    console.log('Crear nueva cita');
  };

  const openCancelDialog = (appointment: Appointment) => {
    const patientName = appointment.patient?.name || 'Paciente';
    setDialogState({
      isOpen: true,
      appointmentId: appointment.id,
      actionType: 'cancel',
      appointmentDetails: {
        patientName: patientName,
        date: new Date(appointment.date).toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: appointment.time.substring(0, 5),
        cost: appointment.cost || 0,
      },
    });
  };

  const openNoShowDialog = (appointment: Appointment) => {
    const patientName = appointment.patient?.name || 'Paciente';
    setDialogState({
      isOpen: true,
      appointmentId: appointment.id,
      actionType: 'no-show',
      appointmentDetails: {
        patientName: patientName,
        date: new Date(appointment.date).toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
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
    const patientName = appointment.patient?.name || 'Paciente';
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
      currentDate: '',
      currentTime: '',
    });
  };

  const handleRescheduleSuccess = () => {
    // Recargar las citas después de reprogramar
    closeRescheduleDialog();

    // Recargar la página para actualizar las citas
    window.location.reload();
  };

  const handleDialogSuccess = () => {
    // Recargar las citas después de una acción exitosa
    toast.success(
      dialogState.actionType === 'cancel'
        ? 'Cita cancelada exitosamente. El paciente recibirá un crédito.'
        : 'Inasistencia reportada exitosamente.'
    );

    // Recargar la página para actualizar las citas
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Citas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona tus citas y horarios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Filters */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  {availableDates.map(date => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-xs sm:text-sm text-muted-foreground">Cargando citas...</div>
            </div>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {appointment.time}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {appointment.duration} min
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                          {appointment.patient.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(appointment.status)}
                              {getStatusText(appointment.status)}
                            </div>
                          </Badge>
                          {/* Indicador de pago */}
                          {appointment.isPaid ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Pagado
                              </div>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Sin pago
                              </div>
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{appointment.type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{appointment.location}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                            <span>{new Date(appointment.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{appointment.patient.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{appointment.patient.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            <strong>Notas:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:flex-col lg:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAppointment(appointment)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="sm:inline">Ver</span>
                    </Button>
                    {appointment.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAppointment(appointment.id)}
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="sm:inline">Confirmar</span>
                      </Button>
                    )}
                    {appointment.status === "confirmed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRescheduleDialog(appointment)}
                          className="w-full sm:w-auto"
                        >
                          <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="sm:inline">Reprogramar</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openCancelDialog(appointment)}
                          className="w-full sm:w-auto"
                        >
                          <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="sm:inline">Cancelar</span>
                        </Button>
                        {/* Mostrar botón de no-show solo si la cita ya pasó */}
                        {new Date(`${appointment.date}T${appointment.time}`) < new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNoShowDialog(appointment)}
                            className="w-full sm:w-auto"
                          >
                            <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="sm:inline">No asistió</span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
          <Card>
            <CardContent className="px-4 sm:px-8 py-12 text-center">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                No se encontraron citas
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                No hay citas que coincidan con los filtros seleccionados.
              </p>
              <Button onClick={handleCreateAppointment} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Cita
              </Button>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Modal para ver detalles de la cita */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Detalles de la Cita</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Información completa de la cita seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4 sm:space-y-6">
              {/* Información del paciente */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Información del Paciente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Nombre:</span>
                    <span className="truncate">{selectedAppointment.patient.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{selectedAppointment.patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{selectedAppointment.patient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Información de la cita */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Información de la Cita</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col sm:flex-row sm:gap-1">
                      <span className="font-medium">Fecha:</span>
                      <span className="text-muted-foreground">{new Date(selectedAppointment.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Hora:</span>
                    <span>{selectedAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Duración:</span>
                    <span>{selectedAppointment.duration} minutos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Tipo:</span>
                    <span>{selectedAppointment.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Ubicación:</span>
                    <span className="truncate">{selectedAppointment.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Estado:</span>
                    <Badge className={`${getStatusColor(selectedAppointment.status)} text-xs`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedAppointment.status)}
                        {getStatusText(selectedAppointment.status)}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedAppointment.notes && (
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Notas</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para cancelar o marcar no-show */}
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

      {/* Dialog para reprogramar */}
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
    </div>
  );
}
