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
import ProfilePhotoUploader from "@/components/ui/profile-photo-uploader";



export default function ProfessionalDashboard() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [professionalName, setProfessionalName] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener la aplicación profesional del usuario
        const { data: professionalApp, error: profError } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profile_photo')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (profError) {
          console.error('Error obteniendo profesional:', profError);
          return;
        }

        if (professionalApp) {
          setProfessionalName(`${professionalApp.first_name} ${professionalApp.last_name}`);
          setProfilePhoto(professionalApp.profile_photo || '');
          
          // Obtener citas del profesional para hoy
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
            .eq('appointment_date', today)
            .order('appointment_time', { ascending: true });

          if (appointmentsError) {
            console.error('Error obteniendo citas:', appointmentsError);
            return;
          }

          // Formatear citas sin información de pacientes (temporal)
          if (appointmentsData && appointmentsData.length > 0) {
            const formattedAppointments: Appointment[] = appointmentsData.map(apt => {
              return {
                id: apt.id,
                patient: {
                  name: `Paciente ${apt.patient_id.slice(0, 8)}`,
                  email: 'No disponible',
                  phone: 'No disponible',
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

          // Calcular estadísticas
          const { data: allAppointments } = await supabase
            .from('appointments')
            .select('appointment_date, cost, patient_id, status')
            .eq('professional_id', professionalApp.id);

          const now = new Date();
          const todayCount = allAppointments?.filter(apt => apt.appointment_date === today).length || 0;
          
          // Calcular citas de ayer para comparación
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const yesterdayCount = allAppointments?.filter(apt => apt.appointment_date === yesterdayStr).length || 0;
          const dailyChange = todayCount - yesterdayCount;
          
          // Pacientes únicos activos (con citas futuras)
          const uniquePatients = new Set(
            allAppointments
              ?.filter(apt => apt.appointment_date >= today)
              ?.map(apt => apt.patient_id)
          );
          const activePatients = uniquePatients.size;

          // Calcular pacientes de la semana pasada para comparación
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          const lastWeekPatients = new Set(
            allAppointments
              ?.filter(apt => apt.appointment_date >= weekAgoStr && apt.appointment_date < today)
              ?.map(apt => apt.patient_id)
          );
          const weeklyChange = activePatients - lastWeekPatients.size;

          // Ingresos del mes actual
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthlyRevenue = allAppointments?.reduce((sum, apt) => {
            const aptDate = new Date(apt.appointment_date);
            if (aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear) {
              return sum + (parseFloat(apt.cost?.toString() || '0'));
            }
            return sum;
          }, 0) || 0;

          // Ingresos del mes pasado para comparación
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const lastMonthRevenue = allAppointments?.reduce((sum, apt) => {
            const aptDate = new Date(apt.appointment_date);
            if (aptDate.getMonth() === lastMonth && aptDate.getFullYear() === lastMonthYear) {
              return sum + (parseFloat(apt.cost?.toString() || '0'));
            }
            return sum;
          }, 0) || 0;
          
          const revenueChange = lastMonthRevenue > 0 
            ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 0;

          setStats([
            {
              title: "Citas Hoy",
              value: todayCount.toString(),
              change: dailyChange >= 0 ? `+${dailyChange} desde ayer` : `${dailyChange} desde ayer`,
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
              title: "Ingresos del Mes",
              value: `$${monthlyRevenue.toLocaleString('es-MX')}`,
              change: revenueChange >= 0 ? `+${revenueChange}% vs mes anterior` : `${revenueChange}% vs mes anterior`,
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

  // Función para navegar a la página de citas
  const handleViewAllAppointments = () => {
    router.push(`/professional/${userId}/appointments`);
  };

  // Función para ver detalles de una cita específica
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Cargando...' : `Bienvenido/a${professionalName ? `, ${professionalName}` : ''}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Foto de Perfil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ProfilePhotoUploader
              professionalId={userId}
              currentPhoto={profilePhoto}
              professionalName={professionalName}
              onPhotoUpdate={(newPhotoUrl) => setProfilePhoto(newPhotoUrl)}
            />
          </div>
          <div className="lg:col-span-2">
            {/* Aquí podrías agregar más información del perfil si es necesario */}
          </div>
        </div>

        {/* Próximas Citas */}
        <Card>
          <CardHeader className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximas Citas</CardTitle>
                <CardDescription>
                  Citas programadas para hoy
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewAllAppointments}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando citas...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay citas programadas para hoy</div>
              ) : (
                appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {appointment.time}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {appointment.patient.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {appointment.type} • {appointment.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewAppointment(appointment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Modal para ver detalles de la cita */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la cita seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Información del paciente */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información del Paciente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Nombre:</span>
                    <span>{selectedAppointment.patient.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <span>{selectedAppointment.patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Teléfono:</span>
                    <span>{selectedAppointment.patient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Información de la cita */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información de la Cita</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fecha:</span>
                    <span>{new Date(selectedAppointment.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Hora:</span>
                    <span>{selectedAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Duración:</span>
                    <span>{selectedAppointment.duration} minutos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tipo:</span>
                    <span>{selectedAppointment.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Ubicación:</span>
                    <span>{selectedAppointment.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Estado:</span>
                    <Badge className={getStatusColor(selectedAppointment.status)}>
                      {getStatusText(selectedAppointment.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedAppointment.notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Notas</h3>
                  <p className="text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
