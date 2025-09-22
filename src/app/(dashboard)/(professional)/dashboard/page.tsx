"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Activity,
  Stethoscope,
  CheckCircle,
  Search,
  Filter,
  X
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Datos de ejemplo para el dashboard profesional
const mockProfessionalData = {
  stats: {
    todayAppointments: 5,
    totalPatients: 45,
    monthlyRevenue: 12500,
    averageRating: 4.8,
    completedSessions: 12,
    pendingAppointments: 3
  },
  todayAppointments: [
    {
      id: 1,
      patient: "María García",
      time: "09:00 AM",
      type: "Consulta General",
      status: "confirmed",
      duration: "60 min"
    },
    {
      id: 2,
      patient: "Carlos López",
      time: "10:30 AM",
      type: "Seguimiento",
      status: "pending",
      duration: "45 min"
    },
    {
      id: 3,
      patient: "Ana Martínez",
      time: "02:00 PM",
      type: "Consulta Especializada",
      status: "confirmed",
      duration: "90 min"
    }
  ],
  recentPatients: [
    {
      id: 1,
      name: "María García",
      lastSession: "Hace 2 días",
      nextAppointment: "Hoy 09:00 AM",
      progress: "Excelente progreso"
    },
    {
      id: 2,
      name: "Carlos López",
      lastSession: "Hace 1 semana",
      nextAppointment: "Mañana 10:30 AM",
      progress: "Progreso constante"
    },
    {
      id: 3,
      name: "Ana Martínez",
      lastSession: "Hace 3 días",
      nextAppointment: "Viernes 02:00 PM",
      progress: "Mejoras notables"
    }
  ]
};

const ProfessionalDashboard = () => {
  const { stats, todayAppointments, recentPatients } = mockProfessionalData;
  
  // Estados para filtros
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  // Función para filtrar citas
  const filteredAppointments = todayAppointments.filter(appointment => {
    const matchesSearch = appointment.patient.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(appointmentSearch.toLowerCase());
    const matchesStatus = appointmentStatus === "all" || appointment.status === appointmentStatus;
    return matchesSearch && matchesStatus;
  });

  // Función para filtrar pacientes
  const filteredPatients = recentPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                         patient.progress.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesFilter = patientFilter === "all" || 
                         (patientFilter === "recent" && patient.lastSession.includes("días")) ||
                         (patientFilter === "upcoming" && patient.nextAppointment.includes("Hoy")) ||
                         (patientFilter === "progress" && patient.progress.includes("Excelente"));
    return matchesSearch && matchesFilter;
  });

  // Función para limpiar filtros
  const clearAppointmentFilters = () => {
    setAppointmentSearch("");
    setAppointmentStatus("all");
  };

  const clearPatientFilters = () => {
    setPatientSearch("");
    setPatientFilter("all");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Profesional</h1>
          <p className="text-muted-foreground">Bienvenido, Dr. María García</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-primary hover:bg-primary/90">
            <Stethoscope className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">+12% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">por confirmar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Citas de hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Citas de Hoy ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros para citas */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente o tipo de cita..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={appointmentStatus} onValueChange={setAppointmentStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="confirmed">Confirmadas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={clearAppointmentFilters}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{appointment.patient}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>{appointment.type}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{appointment.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                        {appointment.status === 'pending' && (
                          <Button size="sm">
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron citas con los filtros aplicados</p>
                  <Button variant="outline" onClick={clearAppointmentFilters} className="mt-2">
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pacientes recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pacientes Recientes ({filteredPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros para pacientes */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o progreso..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={patientFilter} onValueChange={setPatientFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los pacientes</SelectItem>
                    <SelectItem value="recent">Sesiones recientes</SelectItem>
                    <SelectItem value="upcoming">Citas hoy</SelectItem>
                    <SelectItem value="progress">Excelente progreso</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={clearPatientFilters}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div key={patient.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{patient.name}</h3>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Última sesión: {patient.lastSession}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Próxima cita: {patient.nextAppointment}</span>
                          </div>
                        </div>

                        <div className="text-sm">
                          <strong>Progreso:</strong> {patient.progress}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Ver Historial
                        </Button>
                        <Button variant="outline" size="sm">
                          Agendar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron pacientes con los filtros aplicados</p>
                  <Button variant="outline" onClick={clearPatientFilters} className="mt-2">
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20 transition-colors">
              <Link href="/professional/appointments">
                <Calendar className="h-6 w-6" />
                <span>Agendar Cita</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20 transition-colors">
              <Link href="/professional/patients">
                <Users className="h-6 w-6" />
                <span>Ver Pacientes</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20 transition-colors">
              <Link href="/professional/schedules">
                <Clock className="h-6 w-6" />
                <span>Gestionar Horarios</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20 transition-colors">
              <Link href="/professional/incomes">
                <DollarSign className="h-6 w-6" />
                <span>Ver Ingresos</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalDashboard;
