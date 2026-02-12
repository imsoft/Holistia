"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import {
  Users,
  Search,
  Eye,
  Calendar,
  Phone,
  Mail,
  Clock,
  User,
  MapPin,
  Briefcase,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import Image from "next/image";
import { Patient } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { formatPhone } from "@/utils/phone-utils";
import { formatDate, formatLocalDate } from "@/lib/date-utils";


export default function ProfessionalPatients() {
  useUserStoreInit();
  const userId = useUserId();
  const supabase = useMemo(() => createClient(), []);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [therapyFilter, setTherapyFilter] = useState("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    sessionsThisMonth: 0
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchPatients = async () => {
      try {
        // Obtener la aplicación profesional del usuario
        const { data: professionalApp, error: profError } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (profError || !professionalApp) {
          console.error('Error obteniendo profesional:', profError);
          return;
        }

        // Obtener todas las citas del profesional
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('patient_id, appointment_date, appointment_type, status')
          .eq('professional_id', professionalApp.id)
          .order('appointment_date', { ascending: false });

        if (appointmentsError) {
          console.error('Error obteniendo citas:', appointmentsError);
          return;
        }

        if (!appointments || appointments.length === 0) {
          setPatients([]);
          setLoading(false);
          return;
        }

        // Obtener IDs únicos de pacientes
        const uniquePatientIds = [...new Set(appointments.map(apt => apt.patient_id))];

        // Obtener información completa de pacientes desde profiles (incluye avatar_url)
        const { data: patientsInfo, error: patientsInfoError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url')
          .in('id', uniquePatientIds)
          .eq('type', 'patient')
          .eq('account_active', true);

        if (patientsInfoError) {
          console.error('Error obteniendo información de pacientes:', patientsInfoError);
        }

        // Debug: Log de información de pacientes
        console.log('🔍 DEBUG - Pacientes encontrados:', patientsInfo?.length || 0);
        console.log('🔍 DEBUG - IDs únicos de pacientes:', uniquePatientIds);
        console.log('🔍 DEBUG - Datos de pacientes:', patientsInfo);

        // Crear un mapa para acceso rápido a la información de pacientes
        const patientsInfoMap = new Map();
        patientsInfo?.forEach(patient => {
          patientsInfoMap.set(patient.id, patient);
          console.log(`🔍 DEBUG - Paciente mapeado: ${patient.id} -> ${patient.first_name} ${patient.last_name}`);
        });

        // Procesar datos de pacientes usando información real
        const patientsData: Patient[] = uniquePatientIds.map(patientId => {
          const patientAppointments = appointments.filter(apt => apt.patient_id === patientId);
          const patientInfo = patientsInfoMap.get(patientId);
          
          // Calcular última y próxima sesión
          const today = formatLocalDate(new Date());
          const pastSessions = patientAppointments.filter(apt => apt.appointment_date < today);
          const futureSessions = patientAppointments.filter(apt => apt.appointment_date >= today);
          
          const lastSession = pastSessions.length > 0 ? pastSessions[0].appointment_date : undefined;
          const nextSession = futureSessions.length > 0 ? futureSessions[futureSessions.length - 1].appointment_date : null;
          
          // Determinar estado (activo si tiene próxima sesión)
          const status = nextSession ? 'active' : 'inactive';
          
          // Determinar tipo de terapia más común
          const therapyTypes = patientAppointments.map(apt => apt.appointment_type);
          const therapyType = therapyTypes.length > 0 ? (therapyTypes[0] === 'presencial' ? 'Terapia Presencial' : 'Terapia Online') : 'No especificado';

          // Usar nombre real del paciente o fallback
          const patientName = patientInfo ? 
            `${patientInfo.first_name || ''} ${patientInfo.last_name || ''}`.trim() || 
            `Paciente ${patientId.slice(0, 8)}` : 
            `Paciente ${patientId.slice(0, 8)}`;

          // Debug: Log del nombre construido
          console.log(`🔍 DEBUG - Construyendo nombre para ${patientId}:`, {
            patientInfo: patientInfo,
            firstName: patientInfo?.first_name,
            lastName: patientInfo?.last_name,
            constructedName: patientName
          });

          // Obtener avatar del perfil o usar fallback
          const avatarUrl = patientInfo?.avatar_url || 
            (patientInfo?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=random&color=fff&size=150` : 
            '/logos/holistia-black.png');
          
          // Calcular información adicional útil
          const firstAppointment = patientAppointments[patientAppointments.length - 1];
          const joinDate = firstAppointment?.appointment_date || '';
          
          // Obtener información de contacto formateada
          const formattedPhone = patientInfo?.phone ? formatPhone(patientInfo.phone) : 'No disponible';
          
          // Calcular total de citas por tipo
          const presencialCount = patientAppointments.filter(apt => apt.appointment_type === 'presencial').length;
          const onlineCount = patientAppointments.filter(apt => apt.appointment_type === 'online').length;
          
          return {
            id: patientId,
            name: patientName,
            email: patientInfo?.email || 'No disponible',
            phone: formattedPhone,
            location: 'No especificado',
            type: 'patient' as const,
            joinDate,
            lastLogin: lastSession || '',
            appointments: patientAppointments.length,
            age: 0, // No disponible en profiles actualmente
            gender: 'No especificado', // No disponible en profiles actualmente
            status: status as 'active' | 'inactive' | 'suspended',
            lastSession,
            nextSession,
            totalSessions: patientAppointments.filter(apt => apt.status === 'completed').length,
            therapyType,
            avatar: avatarUrl,
            notes: undefined,
            // Información adicional útil
            presencialAppointments: presencialCount,
            onlineAppointments: onlineCount,
          };
        });

        setPatients(patientsData);

        // Calcular estadísticas
        const activePatientsCount = patientsData.filter(p => p.status === 'active').length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const sessionsThisMonth = appointments.filter(apt => {
          const [ay, am, ad] = String(apt.appointment_date).split('T')[0].split('-').map(Number);
          const aptDate = new Date(ay, am - 1, ad);
          return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
        }).length;

        setStats({
          total: patientsData.length,
          active: activePatientsCount,
          inactive: patientsData.length - activePatientsCount,
          sessionsThisMonth
        });

      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [userId, supabase]);


  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'suspended':
        return 'Pausado';
      default:
        return status;
    }
  };

  // Función para ver el perfil del paciente
  const handleViewProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  // Función para agendar una nueva cita
  const handleScheduleAppointment = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsScheduleDialogOpen(true);
  };

  // Función para mostrar todos los pacientes (limpiar filtros)
  const handleViewAllPatients = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTherapyFilter("all");
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;
    const matchesTherapy =
      therapyFilter === "all" || patient.therapyType === therapyFilter;

    return matchesSearch && matchesStatus && matchesTherapy;
  });

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <div className="border-b border-border bg-card w-full">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center px-4 sm:px-6 py-4 sm:py-0 gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pacientes</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona tu lista de pacientes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 w-full">
        {/* Cards de estadísticas (4 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          <AdminStatCard
            title="Total Pacientes"
            value={loading ? "..." : String(stats.total)}
            secondaryText="Total de pacientes"
            tertiaryText="Con al menos una cita"
          />
          <AdminStatCard
            title="Pacientes Activos"
            value={loading ? "..." : String(stats.active)}
            trend={
              stats.total > 0
                ? {
                    value: `${Math.round((stats.active / stats.total) * 100)}%`,
                    positive: stats.active > 0,
                  }
                : undefined
            }
            secondaryText={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% del total` : "0% del total"}
            tertiaryText="Con próxima sesión programada"
          />
          <AdminStatCard
            title="Pacientes Inactivos"
            value={loading ? "..." : String(stats.inactive)}
            secondaryText="Sin próxima sesión"
            tertiaryText="Pacientes sin cita programada"
          />
          <AdminStatCard
            title="Sesiones Este Mes"
            value={loading ? "..." : String(stats.sessionsThisMonth)}
            secondaryText="Sesiones completadas"
            tertiaryText="En el mes actual"
          />
        </div>

        {/* Filtros (máximo 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
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
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="suspended">Pausado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={therapyFilter} onValueChange={setTherapyFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de terapia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="Terapia Individual">
                Terapia Individual
              </SelectItem>
              <SelectItem value="Terapia de Pareja">
                Terapia de Pareja
              </SelectItem>
              <SelectItem value="Terapia Familiar">
                Terapia Familiar
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleViewAllPatients}
          >
            <Users className="h-4 w-4 mr-2" />
            Ver Todos
          </Button>
        </div>

        {/* Patients List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-8 bg-muted rounded w-40 mx-auto" />
                <div className="h-64 bg-muted rounded-lg" />
              </div>
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={patient.avatar}
                      alt={patient.name}
                      width={60}
                      height={60}
                      className="h-12 w-12 sm:h-15 sm:w-15 aspect-square rounded-full object-cover border-2 border-border"
                      unoptimized={patient.avatar?.includes('supabase.co') || patient.avatar?.includes('supabase.in')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logos/holistia-black.png";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                        {patient.name}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {patient.appointments} {patient.appointments === 1 ? 'cita' : 'citas'} totales
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {patient.therapyType}
                    </p>
                    {patient.joinDate && (
                      <p className="text-xs text-muted-foreground">
                        Cliente desde {formatDate(patient.joinDate, 'es-MX', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{formatPhone(patient.phone || '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{patient.totalSessions} sesiones</span>
                  </div>
                  {patient.nextSession && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Próxima:{" "}
                        {formatDate(patient.nextSession, "es-MX")}
                      </span>
                    </div>
                  )}
                </div>

                {patient.notes && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-muted-foreground">
                      {patient.notes}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProfile(patient)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Ver Perfil</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleScheduleAppointment(patient)}
                    className="sm:px-3"
                  >
                    <Calendar className="h-4 w-4 sm:mr-0" />
                    <span className="sm:hidden ml-2">Agendar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          ) : null}
        </div>

        {!loading && filteredPatients.length === 0 && (
          <Card className="w-full">
            <CardContent className="px-4 sm:px-8 py-12 text-center">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                No hay pacientes que coincidan con los filtros seleccionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para ver perfil del paciente */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perfil del Paciente</DialogTitle>
            <DialogDescription>
              Información completa del paciente seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              {/* Información personal */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Nombre:</span>
                    <span>{selectedPatient.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedPatient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedPatient.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(selectedPatient.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información de Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span className="break-all">{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{formatPhone(selectedPatient.phone || '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Ubicación:</span>
                    <span>{selectedPatient.location}</span>
                  </div>
                </div>
              </div>

              {/* Información de terapia */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información de Terapia</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Total de sesiones:</span>
                    <span>{selectedPatient.totalSessions}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tipo de terapia:</span>
                    <span>{selectedPatient.therapyType}</span>
                  </div>
                  {selectedPatient.lastSession && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Última sesión:</span>
                      <span>{formatDate(selectedPatient.lastSession, 'es-MX')}</span>
                    </div>
                  )}
                  {selectedPatient.nextSession && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Próxima sesión:</span>
                      <span>{formatDate(selectedPatient.nextSession, 'es-MX')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {selectedPatient.notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Notas</h3>
                  <p className="text-muted-foreground">{selectedPatient.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para agendar nueva cita */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Nueva Cita</DialogTitle>
            <DialogDescription>
              Programar una nueva cita con {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Paciente:</h4>
                <p className="text-sm text-muted-foreground">{selectedPatient.name}</p>
              </div>
              
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Funcionalidad en desarrollo</h3>
                <p className="text-muted-foreground mb-4">
                  El formulario para agendar citas estará disponible próximamente.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
