"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardStats, Appointment } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { AdminRatingDisplay } from "@/components/ui/admin-rating-display";
import { VerifiedBadge } from "@/components/ui/verified-badge";



export default function ProfessionalDashboard() {
  const params = useParams();
  const router = useRouter();
  const userIdParam = params.id as string; // Este es el user_id, no el professional_id
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [professionalName, setProfessionalName] = useState<string>("");
  const [professionalEmail, setProfessionalEmail] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [professionalId, setProfessionalId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [registrationFeeStatus, setRegistrationFeeStatus] = useState<{
    paid: boolean;
    amount: number;
    currency: string;
    expires_at: string | null;
    paid_at: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener email del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setProfessionalEmail(user.email);
        }

        // Obtener la aplicación profesional del usuario
        // El parámetro de la URL es el user_id, no el professional_id
        const { data: professionalApp, error: profError } = await supabase
          .from('professional_applications')
          .select('id, user_id, first_name, last_name, profile_photo, working_start_time, working_end_time, registration_fee_paid, registration_fee_amount, registration_fee_currency, registration_fee_paid_at, registration_fee_expires_at, is_verified')
          .eq('user_id', userIdParam)
          .eq('status', 'approved')
          .single();

        if (profError) {
          console.error('Error obteniendo profesional:', profError);
          return;
        }

        if (professionalApp) {
          setProfessionalName(`${professionalApp.first_name} ${professionalApp.last_name}`);
          setProfilePhoto(professionalApp.profile_photo || '');
          setProfessionalId(professionalApp.id);
          setUserId(professionalApp.user_id);
          setIsVerified(professionalApp.is_verified || false);
          setRegistrationFeeStatus({
            paid: professionalApp.registration_fee_paid || false,
            amount: professionalApp.registration_fee_amount || 600,
            currency: professionalApp.registration_fee_currency || 'mxn',
            expires_at: professionalApp.registration_fee_expires_at,
            paid_at: professionalApp.registration_fee_paid_at,
          });
          
          // Obtener citas próximas del profesional (desde hoy en adelante)
          const today = new Date().toISOString().split('T')[0];

          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              appointment_time,
              duration_minutes,
              appointment_type,
              status,
              location,
              notes,
              patient_id
            `)
            .eq('professional_id', professionalApp.id)
            .gte('appointment_date', today) // Citas desde hoy en adelante
            .in('status', ['pending', 'confirmed', 'completed']) // Incluir todos los estados relevantes
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true })
            .limit(10); // Limitar a las próximas 10 citas

          if (appointmentsError) {
            console.error('Error obteniendo citas:', appointmentsError);
            return;
          }

          // Obtener información de los pacientes usando la vista professional_patient_info
          let patientsData: { patient_id: string; full_name: string; email: string; phone: string }[] = [];
          if (appointmentsData && appointmentsData.length > 0) {
            const patientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
            
            // Obtener datos de pacientes desde la vista professional_patient_info
            const { data: patientsInfo } = await supabase
              .from('professional_patient_info')
              .select('patient_id, full_name, phone, email')
              .eq('professional_id', professionalApp.id)
              .in('patient_id', patientIds);

            if (patientsInfo) {
              patientsData = patientsInfo;
            }
          }

          // Formatear citas con información real de pacientes
          if (appointmentsData && appointmentsData.length > 0) {
            const formattedAppointments: Appointment[] = appointmentsData
              .map(apt => {
                const patient = patientsData.find(p => p.patient_id === apt.patient_id);
                
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
                  location: apt.location || (apt.appointment_type === 'online' ? 'Online' : ''),
                  notes: apt.notes || undefined,
                };
              });

            setAppointments(formattedAppointments);
          }

          // Calcular estadísticas - Contar todas las citas (pending, confirmed, completed)
          const { data: allAppointments } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              cost,
              patient_id,
              status
            `)
            .eq('professional_id', professionalApp.id)
            .in('status', ['pending', 'confirmed', 'completed']); // Incluir todos los estados relevantes

          // Obtener pagos para todas las citas con el monto
          let allPaymentsData: { appointment_id: string; status: string; amount: number }[] = [];
          if (allAppointments && allAppointments.length > 0) {
            const allAppointmentIds = allAppointments.map(apt => apt.id);
            const { data: allPayments } = await supabase
              .from('payments')
              .select('appointment_id, status, amount')
              .in('appointment_id', allAppointmentIds);

            allPaymentsData = allPayments || [];
          }

          // Contar todas las citas (pending, confirmed, completed)
          // Incluir todas las citas independientemente del estado para estadísticas más precisas
          const paidAppointments = allAppointments || [];

          const now = new Date();

          // Calcular fecha de hace una semana para comparaciones
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];

          // Contar citas próximas (desde hoy en adelante)
          const upcomingCount = paidAppointments.filter(apt => apt.appointment_date >= today).length;

          // Calcular citas futuras de la semana pasada para comparación
          const lastWeekUpcomingCount = paidAppointments.filter(apt =>
            apt.appointment_date >= weekAgoStr && apt.appointment_date < today
          ).length;
          const upcomingChange = upcomingCount - lastWeekUpcomingCount;

          // Pacientes únicos activos (con citas futuras y pagadas)
          const uniquePatients = new Set(
            paidAppointments
              .filter(apt => apt.appointment_date >= today)
              .map(apt => apt.patient_id)
          );
          const activePatients = uniquePatients.size;

          // Calcular pacientes de la semana pasada para comparación
          const lastWeekPatients = new Set(
            paidAppointments
              .filter(apt => apt.appointment_date >= weekAgoStr && apt.appointment_date < today)
              .map(apt => apt.patient_id)
          );
          const weeklyChange = activePatients - lastWeekPatients.size;

          // CAMBIO CRÍTICO: Calcular ingresos basados en PAGOS REALES
          // Usamos TODOS los pagos exitosos (no solo del mes actual)
          // Y mostramos el ingreso NETO (después de comisión 15% Holistia)
          
          const PROFESSIONAL_SHARE = 0.85; // 85% para el profesional (15% para Holistia)
          
          // Calcular ingresos TOTALES de todos los pagos exitosos
          const allSucceededPayments = allPaymentsData.filter(p => p.status === 'succeeded');
          
          const totalRevenue = allSucceededPayments.reduce((sum, payment) => {
            const amount = Number(payment.amount || 0);
            // Restar comisión de Holistia (15%)
            return sum + (amount * PROFESSIONAL_SHARE);
          }, 0);
          
          // Para el mes actual (por comparación)
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const currentMonthPayments = allSucceededPayments.filter(payment => {
            const apt = allAppointments?.find(a => a.id === payment.appointment_id);
            if (!apt) return false;
            const aptDate = new Date(apt.appointment_date);
            return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
          });
          
          const monthlyRevenue = currentMonthPayments.reduce((sum, payment) => {
            const amount = Number(payment.amount || 0);
            return sum + (amount * PROFESSIONAL_SHARE);
          }, 0);

          // Ingresos del mes pasado para comparación
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          
          const lastMonthPayments = allSucceededPayments.filter(payment => {
            const apt = allAppointments?.find(a => a.id === payment.appointment_id);
            if (!apt) return false;
            const aptDate = new Date(apt.appointment_date);
            return aptDate.getMonth() === lastMonth && aptDate.getFullYear() === lastMonthYear;
          });
          
          const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => {
            const amount = Number(payment.amount || 0);
            return sum + (amount * PROFESSIONAL_SHARE);
          }, 0);

          setStats([
            {
              title: "Citas Próximas",
              value: upcomingCount.toString(),
              change: upcomingChange >= 0 ? `+${upcomingChange} vs semana pasada` : `${upcomingChange} vs semana pasada`,
              icon: Calendar,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              title: "Pacientes Activos",
              value: activePatients.toString(),
              change: weeklyChange >= 0 ? `+${weeklyChange} esta semana` : `${weeklyChange} esta semana`,
              icon: Users,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              title: "Ingresos Totales",
              value: `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              change: `Neto después de comisión (15%)`,
              icon: DollarSign,
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
          ]);
        }
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userIdParam, supabase, refreshKey]);

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

  // Función para navegar a la página de citas
  const handleViewAllAppointments = () => {
    router.push(`/professional/${userId}/appointments`);
  };

  // Función para ver detalles de una cita específica
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  // Función para refrescar datos después de actualizar el perfil
  const handleProfileUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
                {isVerified && <VerifiedBadge size={20} />}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {loading ? 'Cargando...' : `Bienvenido/a${professionalName ? `, ${professionalName}` : ''}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 sm:p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximas Citas */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <CardTitle className="text-base sm:text-lg">Próximas Citas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Citas programadas para hoy
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewAllAppointments}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">Cargando citas...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">No hay citas programadas para hoy</div>
              ) : (
                appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-3 sm:gap-0"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium text-foreground">
                        {appointment.time}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-medium text-foreground truncate">
                        {appointment.patient.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {appointment.type} • {appointment.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 justify-end sm:justify-start">
                    <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                      {getStatusText(appointment.status)}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewAppointment(appointment)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>


        {/* Alerta de Estado de Inscripción */}
        {registrationFeeStatus && (
          <>
            {/* Sin pagar */}
            {!registrationFeeStatus.paid && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm sm:text-base font-semibold text-red-900">
                        ⚠️ Pago de Inscripción Pendiente
                      </h3>
                      <p className="text-xs sm:text-sm text-red-800">
                        Para aparecer en la plataforma de Holistia y poder recibir citas de pacientes, 
                        necesitas pagar la cuota de inscripción anual de <strong>${registrationFeeStatus.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {registrationFeeStatus.currency.toUpperCase()}</strong>.
                      </p>
                      <Button 
                        className="mt-3 bg-red-600 hover:bg-red-700"
                        size="sm"
                        onClick={() => router.push(`/patient/${userId}/explore/become-professional`)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar Inscripción
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagado pero expirado */}
            {registrationFeeStatus.paid && registrationFeeStatus.expires_at && new Date(registrationFeeStatus.expires_at) <= new Date() && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm sm:text-base font-semibold text-red-900">
                        ❌ Inscripción Expirada
                      </h3>
                      <p className="text-xs sm:text-sm text-red-800">
                        Tu inscripción anual expiró el <strong>{new Date(registrationFeeStatus.expires_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. 
                        Para seguir apareciendo en la plataforma y poder recibir citas, necesitas renovar tu pago de <strong>${registrationFeeStatus.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {registrationFeeStatus.currency.toUpperCase()}</strong>.
                      </p>
                      <Button 
                        className="mt-3 bg-red-600 hover:bg-red-700"
                        size="sm"
                        onClick={() => router.push(`/patient/${userId}/explore/become-professional`)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Renovar Inscripción
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagado pero próximo a vencer (30 días) */}
            {registrationFeeStatus.paid && 
             registrationFeeStatus.expires_at && 
             new Date(registrationFeeStatus.expires_at) > new Date() &&
             new Date(registrationFeeStatus.expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm sm:text-base font-semibold text-yellow-900">
                        ⚠️ Renovación Próxima
                      </h3>
                      <p className="text-xs sm:text-sm text-yellow-800">
                        Tu inscripción expira el <strong>{new Date(registrationFeeStatus.expires_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. 
                        Renueva tu pago de <strong>${registrationFeeStatus.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {registrationFeeStatus.currency.toUpperCase()}</strong> para seguir apareciendo en la plataforma sin interrupciones.
                      </p>
                      <Button 
                        className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                        size="sm"
                        onClick={() => router.push(`/patient/${userId}/explore/become-professional`)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Renovar Ahora
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagado y vigente (solo mostrar si es reciente, menos de 7 días desde el pago) */}
            {registrationFeeStatus.paid && 
             registrationFeeStatus.expires_at && 
             new Date(registrationFeeStatus.expires_at) > new Date() &&
             new Date(registrationFeeStatus.expires_at).getTime() - new Date().getTime() >= 30 * 24 * 60 * 60 * 1000 &&
             registrationFeeStatus.paid_at &&
             new Date().getTime() - new Date(registrationFeeStatus.paid_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-green-900">
                        ✅ Inscripción Activa
                      </h3>
                      <p className="text-xs sm:text-sm text-green-800 mt-1">
                        Tu inscripción está vigente hasta el <strong>{new Date(registrationFeeStatus.expires_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. 
                        ¡Gracias por ser parte de Holistia!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Calificación de administrador */}
        {professionalId && (
          <div className="mt-6">
            <AdminRatingDisplay professionalId={professionalId} />
          </div>
        )}

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
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Nombre:</span>
                    <span className="truncate">{selectedAppointment.patient.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{selectedAppointment.patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
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
                    <span className="font-medium">Ubicación:</span>
                    <span className="truncate">{selectedAppointment.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Estado:</span>
                    <Badge className={`${getStatusColor(selectedAppointment.status)} text-xs`}>
                      {getStatusText(selectedAppointment.status)}
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
    </div>
  );
}
