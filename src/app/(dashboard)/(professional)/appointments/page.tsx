"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  X
} from "lucide-react";
import { useState } from "react";

// Datos de ejemplo
const mockAppointments = [
  {
    id: 1,
    patientName: "María González",
    patientEmail: "maria@email.com",
    patientPhone: "+52 55 1234 5678",
    date: "2024-01-22",
    time: "09:00",
    duration: "30 min",
    type: "Consulta General",
    status: "confirmada",
    notes: "Seguimiento de tratamiento"
  },
  {
    id: 2,
    patientName: "Carlos Rodríguez",
    patientEmail: "carlos@email.com",
    patientPhone: "+52 55 2345 6789",
    date: "2024-01-22",
    time: "10:30",
    duration: "45 min",
    type: "Primera Consulta",
    status: "pendiente",
    notes: "Nuevo paciente"
  },
  {
    id: 3,
    patientName: "Ana Martínez",
    patientEmail: "ana@email.com",
    patientPhone: "+52 55 3456 7890",
    date: "2024-01-22",
    time: "11:15",
    duration: "60 min",
    type: "Consulta Especializada",
    status: "confirmada",
    notes: "Revisión de resultados"
  }
];

const CitasPage = () => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
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
      case 'cancelada':
        return XCircle;
      default:
        return Clock;
    }
  };

  // Función para filtrar citas
  const filteredAppointments = mockAppointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    const matchesType = typeFilter === "all" || appointment.type === typeFilter;
    
    const matchesDate = (() => {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      switch (dateFilter) {
        case "today":
          return appointmentDate.toDateString() === today.toDateString();
        case "week":
          return appointmentDate >= today && appointmentDate <= weekFromNow;
        case "month":
          return appointmentDate >= today && appointmentDate <= monthFromNow;
        case "all":
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setTypeFilter("all");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Citas</h1>
          <p className="text-muted-foreground">Administra todas tus citas médicas</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros ({filteredAppointments.length} citas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, email o tipo de cita..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtros en filas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por fecha */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Período</label>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={dateFilter === "today" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setDateFilter("today")}
                  >
                    Hoy
                  </Button>
                  <Button 
                    variant={dateFilter === "week" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setDateFilter("week")}
                  >
                    Esta Semana
                  </Button>
                  <Button 
                    variant={dateFilter === "month" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setDateFilter("month")}
                  >
                    Este Mes
                  </Button>
                  <Button 
                    variant={dateFilter === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setDateFilter("all")}
                  >
                    Todas
                  </Button>
                </div>
              </div>
              
              {/* Filtro por estado */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="confirmada">Confirmadas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro por tipo */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Tipo de Cita</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="Consulta General">Consulta General</SelectItem>
                    <SelectItem value="Primera Consulta">Primera Consulta</SelectItem>
                    <SelectItem value="Consulta Especializada">Consulta Especializada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Botón limpiar */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de citas */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => {
            const StatusIcon = getStatusIcon(appointment.status);
            
            return (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{appointment.patientName}</h3>
                          <Badge className={`${getStatusColor(appointment.status)} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(appointment.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time} - {appointment.duration}</span>
                          </div>
                          <div className="text-muted-foreground">
                            <span className="font-medium">{appointment.type}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Email:</strong> {appointment.patientEmail}</p>
                          <p><strong>Teléfono:</strong> {appointment.patientPhone}</p>
                          {appointment.notes && (
                            <p><strong>Notas:</strong> {appointment.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron citas</h3>
                <p className="mb-4">No hay citas que coincidan con los filtros aplicados</p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CitasPage;
