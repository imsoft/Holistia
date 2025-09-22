"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowUpRight,
  Plus,
  Eye
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo para el dashboard profesional
const mockData = {
  stats: {
    todayAppointments: 8,
    totalPatients: 156,
    monthlyEarnings: 45600,
    averageRating: 4.8,
    pendingAppointments: 3,
    completedAppointments: 5
  },
  todayAppointments: [
    {
      id: 1,
      patientName: "María González",
      time: "09:00",
      type: "Consulta General",
      status: "confirmada",
      duration: "30 min"
    },
    {
      id: 2,
      patientName: "Carlos Rodríguez",
      time: "10:30",
      type: "Seguimiento",
      status: "pendiente",
      duration: "45 min"
    },
    {
      id: 3,
      patientName: "Ana Martínez",
      time: "11:15",
      type: "Primera Consulta",
      status: "confirmada",
      duration: "60 min"
    }
  ],
  recentPatients: [
    {
      id: 1,
      name: "María González",
      lastVisit: "2024-01-15",
      nextAppointment: "2024-01-22",
      totalVisits: 12
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      lastVisit: "2024-01-10",
      nextAppointment: "2024-01-24",
      totalVisits: 8
    }
  ]
};

const ProfessionalDashboard = () => {
  const { stats, todayAppointments, recentPatients } = mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmada':
        return CheckCircle;
      case 'pendiente':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Profesional</h1>
          <p className="text-muted-foreground">Gestiona tu práctica médica de manera eficiente</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/citas">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Link>
          </Button>
          <Button asChild>
            <Link href="/horarios">
              <Calendar className="h-4 w-4 mr-2" />
              Gestionar Horarios
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas de Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2 desde ayer
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12 este mes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyEarnings.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              127 reseñas
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Citas de hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Citas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => {
                const StatusIcon = getStatusIcon(appointment.status);
                return (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{appointment.patientName}</h4>
                        <Badge className={`${getStatusColor(appointment.status)} border text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </span>
                        <span>{appointment.duration}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/citas">Ver todas las citas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pacientes recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pacientes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{patient.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Última visita: {new Date(patient.lastVisit).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Próxima cita: {new Date(patient.nextAppointment).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {patient.totalVisits} visitas
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/pacientes">Ver todos los pacientes</Link>
              </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/citas">
                <Calendar className="h-6 w-6" />
                <span>Gestionar Citas</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/pacientes">
                <Users className="h-6 w-6" />
                <span>Ver Pacientes</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/ingresos">
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
