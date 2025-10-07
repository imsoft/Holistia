"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Eye,
  Calendar,
  Phone,
  Mail,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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


export default function ProfessionalPatients() {
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [therapyFilter, setTherapyFilter] = useState("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sessionsThisMonth: 0
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  useEffect(() => {
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

        // Procesar datos de pacientes usando solo información de las citas
        const patientsData: Patient[] = uniquePatientIds.map(patientId => {
          const patientAppointments = appointments.filter(apt => apt.patient_id === patientId);
          
          // Calcular última y próxima sesión
          const today = new Date().toISOString().split('T')[0];
          const pastSessions = patientAppointments.filter(apt => apt.appointment_date < today);
          const futureSessions = patientAppointments.filter(apt => apt.appointment_date >= today);
          
          const lastSession = pastSessions.length > 0 ? pastSessions[0].appointment_date : undefined;
          const nextSession = futureSessions.length > 0 ? futureSessions[futureSessions.length - 1].appointment_date : null;
          
          // Determinar estado (activo si tiene próxima sesión)
          const status = nextSession ? 'active' : 'inactive';
          
          // Determinar tipo de terapia más común
          const therapyTypes = patientAppointments.map(apt => apt.appointment_type);
          const therapyType = therapyTypes.length > 0 ? (therapyTypes[0] === 'presencial' ? 'Terapia Presencial' : 'Terapia Online') : 'No especificado';

          // Generar nombre basado en el ID del paciente (temporal)
          const patientName = `Paciente ${patientId.slice(0, 8)}`;

          return {
            id: patientId,
            name: patientName,
            email: 'No disponible',
            phone: 'No disponible',
            location: 'No especificado',
            type: 'patient' as const,
            joinDate: patientAppointments[patientAppointments.length - 1]?.appointment_date || '',
            lastLogin: '',
            appointments: patientAppointments.length,
            age: 0,
            gender: 'No especificado',
            status: status as 'active' | 'inactive' | 'suspended',
            lastSession,
            nextSession,
            totalSessions: patientAppointments.filter(apt => apt.status === 'completed').length,
            therapyType,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            notes: undefined,
          };
        });

        setPatients(patientsData);

        // Calcular estadísticas
        const activePatientsCount = patientsData.filter(p => p.status === 'active').length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const sessionsThisMonth = appointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
        }).length;

        setStats({
          total: patientsData.length,
          active: activePatientsCount,
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
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tu lista de pacientes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8 w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pacientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.total}
              </div>
              <p className="text-xs text-muted-foreground">Total de pacientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pacientes Activos
              </CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.active}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% del total` : '0% del total'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sesiones Este Mes
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.sessionsThisMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                Sesiones completadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="w-full">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground">Cargando pacientes...</div>
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="px-6 py-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Image
                      src={patient.avatar}
                      alt={patient.name}
                      width={60}
                      height={60}
                      className="h-15 w-15 aspect-square rounded-full object-cover border-2 border-border"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {patient.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.age} años • {patient.gender}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {patient.therapyType}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
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
                        {new Date(patient.nextSession).toLocaleDateString(
                          "es-ES"
                        )}
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

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProfile(patient)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleScheduleAppointment(patient)}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          ) : null}
        </div>

        {!loading && filteredPatients.length === 0 && (
          <Card className="w-full">
            <CardContent className="px-8 py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-muted-foreground">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Nombre:</span>
                    <span>{selectedPatient.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Edad:</span>
                    <span>{selectedPatient.age} años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Género:</span>
                    <span>{selectedPatient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{selectedPatient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Ubicación:</span>
                    <span>{selectedPatient.location}</span>
                  </div>
                </div>
              </div>

              {/* Información de terapia */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información de Terapia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Total de sesiones:</span>
                    <span>{selectedPatient.totalSessions}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tipo de terapia:</span>
                    <span>{selectedPatient.therapyType}</span>
                  </div>
                  {selectedPatient.lastSession && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Última sesión:</span>
                      <span>{new Date(selectedPatient.lastSession).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  {selectedPatient.nextSession && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Próxima sesión:</span>
                      <span>{new Date(selectedPatient.nextSession).toLocaleDateString('es-ES')}</span>
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
