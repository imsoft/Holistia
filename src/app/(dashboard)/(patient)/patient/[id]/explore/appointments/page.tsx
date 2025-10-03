"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";

interface Professional {
  id: string;
  full_name: string;
  avatar_url?: string;
  especialidad?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: 'presencial' | 'online';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cost: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  professional: Professional;
}

const statusConfig = {
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  completed: {
    label: "Completada",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

const typeConfig = {
  presencial: {
    label: "Presencial",
    icon: Users,
    color: "text-blue-600",
  },
  online: {
    label: "En línea",
    icon: Monitor,
    color: "text-green-600",
  },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const userId = params.id as string;

  // Obtener citas del usuario
  useEffect(() => {
    const getAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching appointments for user:', userId);
        
        // Primero verificamos si el usuario está autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('User not authenticated:', authError);
          setError('Usuario no autenticado. Por favor inicia sesión.');
          return;
        }

        console.log('Authenticated user:', user.id, 'Looking for userId:', userId);

        // Verificar que el usuario autenticado coincida con el parámetro de la URL
        if (user.id !== userId) {
          console.error('User ID mismatch. Authenticated:', user.id, 'URL param:', userId);
          setError('No tienes permisos para ver estas citas.');
          return;
        }

        console.log('✅ User ID matches, proceeding to fetch appointments...');

        // Consulta a la tabla appointments
        const { data: appointmentsData, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)  // Usar el ID del usuario autenticado, no el parámetro
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) {
          console.error('Supabase error fetching appointments:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Manejar diferentes tipos de errores
          if (error.code === '42P01') {
            setError('La tabla de citas no existe. Por favor contacta al administrador.');
          } else if (error.code === '42501') {
            setError('No tienes permisos para acceder a las citas.');
          } else {
            setError(`Error al cargar las citas: ${error.message}`);
          }
          return;
        }

        console.log('Appointments fetched successfully:', appointmentsData);
        
        if (!appointmentsData || appointmentsData.length === 0) {
          console.log('No appointments found for user');
          setAppointments([]);
          return;
        }
        
        // Obtener información de los profesionales
        const professionalIds = [...new Set(appointmentsData.map(apt => apt.professional_id))];
        
        const { data: professionalsData } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profession, profile_photo, user_id')
          .in('id', professionalIds);
        
        // Obtener avatares de profiles
        const userIds = professionalsData?.map(p => p.user_id).filter(Boolean) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);
        
        // Combinar datos
        const formattedAppointments = appointmentsData.map(apt => {
          const prof = professionalsData?.find(p => p.id === apt.professional_id);
          const profile = profilesData?.find(p => p.id === prof?.user_id);
          
          return {
            ...apt,
            professional: {
              id: prof?.id || '',
              full_name: prof ? `${prof.first_name} ${prof.last_name}` : 'Profesional',
              avatar_url: profile?.avatar_url || prof?.profile_photo,
              especialidad: prof?.profession
            }
          };
        });
        
        setAppointments(formattedAppointments);
        
      } catch (error) {
        console.error('Unexpected error fetching appointments:', error);
        setError('Error inesperado al cargar las citas. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      getAppointments();
    } else {
      setError('ID de usuario no válido.');
      setLoading(false);
    }
  }, [userId, supabase]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setCancelling(appointmentId);
      
      console.log('Cancelling appointment:', appointmentId);
      
      // Obtener el usuario autenticado para verificar permisos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuario no autenticado.');
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('patient_id', user.id);

      if (error) {
        console.error('Error cancelling appointment:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error al cancelar la cita: ${error.message}`);
        return;
      }

      console.log('Appointment cancelled successfully');
      
      // Actualizar el estado local
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' as const }
            : apt
        )
      );
      
      alert('Cita cancelada exitosamente.');
      
    } catch (error) {
      console.error('Unexpected error cancelling appointment:', error);
      alert('Error inesperado al cancelar la cita. Por favor intenta de nuevo.');
    } finally {
      setCancelling(null);
    }
  };

  // Función para navegar a la página de explorar profesionales
  const handleNewAppointment = () => {
    router.push(`/patient/${userId}/explore`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status === "confirmed" || appointment.status === "pending"
  );

  const pastAppointments = appointments.filter(
    (appointment) => appointment.status === "completed" || appointment.status === "cancelled"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Citas</h1>
          <p className="text-muted-foreground">
            Gestiona tus citas actuales y revisa el historial de consultas
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando citas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar las citas</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Citas próximas */}
            {upcomingAppointments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Próximas Citas ({upcomingAppointments.length})
            </h2>
            <div className="grid gap-6">
              {upcomingAppointments.map((appointment) => {
                const StatusIcon = statusConfig[appointment.status as keyof typeof statusConfig].icon;
                const TypeIcon = typeConfig[appointment.appointment_type as keyof typeof typeConfig].icon;
                
                return (
                  <div
                    key={appointment.id}
                    className="p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Información del profesional */}
                      <Link 
                        href={`/patient/${userId}/explore/professional/${appointment.professional.id}`}
                        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={appointment.professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.professional.full_name)}&background=random`}
                          alt={appointment.professional.full_name}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full object-cover border-2 border-border"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {appointment.professional.full_name}
                          </h3>
                          <p className="text-muted-foreground">
                            {appointment.professional.especialidad}
                          </p>
                        </div>
                      </Link>

                      {/* Información de la cita */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatDate(appointment.appointment_date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.appointment_time} ({appointment.duration_minutes} min)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${typeConfig[appointment.appointment_type as keyof typeof typeConfig].color}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {typeConfig[appointment.appointment_type as keyof typeof typeConfig].label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(appointment.cost)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">
                            {appointment.location || (appointment.appointment_type === 'online' ? 'Consulta en línea' : 'Ubicación por confirmar')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge
                            className={statusConfig[appointment.status as keyof typeof statusConfig].color}
                          >
                            {statusConfig[appointment.status as keyof typeof statusConfig].label}
                          </Badge>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-center">
                        {appointment.status === "confirmed" && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancelling === appointment.id}
                          >
                            {cancelling === appointment.id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Notas */}
                    {appointment.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notas:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

            {/* Citas anteriores */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Historial de Citas ({pastAppointments.length})
                </h2>
                <div className="grid gap-4">
                  {pastAppointments.map((appointment) => {
                    const TypeIcon = typeConfig[appointment.appointment_type as keyof typeof typeConfig].icon;
                
                    return (
                      <div
                        key={appointment.id}
                        className="p-4 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <Link 
                            href={`/patient/${userId}/explore/professional/${appointment.professional.id}`}
                            className="flex items-center gap-4 hover:opacity-80 transition-opacity flex-1"
                          >
                            <Image
                              src={appointment.professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.professional.full_name)}&background=random`}
                              alt={appointment.professional.full_name}
                              width={60}
                              height={60}
                              className="h-15 w-15 rounded-full object-cover border-2 border-border"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                                  {appointment.professional.full_name}
                                </h3>
                                <Badge
                                  className={statusConfig[appointment.status as keyof typeof statusConfig].color}
                                >
                                  {statusConfig[appointment.status as keyof typeof statusConfig].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {appointment.professional.especialidad}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(appointment.appointment_date)} a las {appointment.appointment_time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <TypeIcon className={`h-3 w-3 ${typeConfig[appointment.appointment_type as keyof typeof typeConfig].color}`} />
                                  {typeConfig[appointment.appointment_type as keyof typeof typeConfig].label}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatPrice(appointment.cost)}
                                </div>
                              </div>
                            </div>
                          </Link>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleNewAppointment}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Nueva cita
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estado vacío */}
            {appointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No se encontraron citas
                </h3>
                <p className="text-muted-foreground">
                  No tienes citas programadas aún
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
