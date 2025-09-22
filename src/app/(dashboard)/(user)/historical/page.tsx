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
  History,
  Search,
  Calendar,
  Clock,
  User,
  Star,
  CheckCircle,
  Filter,
  X,
  Download
} from "lucide-react";
import { useState } from "react";

const mockHistoricalAppointments = [
  {
    id: 1,
    professional: "Dr. María García",
    specialty: "Psicología Clínica",
    date: "2024-01-10",
    time: "09:00 AM",
    type: "Consulta General",
    duration: "60 min",
    rating: 5,
    notes: "Excelente sesión, mucho progreso"
  },
  {
    id: 2,
    professional: "Dr. Carlos López",
    specialty: "Terapia Familiar",
    date: "2024-01-05",
    time: "10:30 AM",
    type: "Seguimiento",
    duration: "45 min",
    rating: 4,
    notes: "Buena sesión, herramientas útiles"
  },
  {
    id: 3,
    professional: "Dra. Ana Martínez",
    specialty: "Psicoterapia",
    date: "2023-12-28",
    time: "02:00 PM",
    type: "Sesión Individual",
    duration: "90 min",
    rating: 5,
    notes: "Sesión muy productiva y reveladora"
  },
  {
    id: 4,
    professional: "Dr. Luis Hernández",
    specialty: "Terapia Cognitiva",
    date: "2023-12-20",
    time: "11:00 AM",
    type: "Primera Consulta",
    duration: "60 min",
    rating: 4,
    notes: "Primera impresión muy positiva"
  }
];

const UserHistoricalPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Función para filtrar citas históricas
  const filteredAppointments = mockHistoricalAppointments.filter(appointment => {
    const matchesSearch = appointment.professional.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === "all" || appointment.rating.toString() === ratingFilter;
    
    const matchesDate = (() => {
      const appointmentDate = new Date(appointment.date);
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      switch (dateFilter) {
        case "month":
          return appointmentDate >= monthAgo;
        case "quarter":
          return appointmentDate >= threeMonthsAgo;
        case "all":
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesRating && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setRatingFilter("all");
    setDateFilter("all");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial de Citas</h1>
          <p className="text-muted-foreground">Revisa todas tus sesiones anteriores</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Historial
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockHistoricalAppointments.length}</div>
            <p className="text-xs text-muted-foreground">sesiones completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">sesiones este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5</div>
            <p className="text-xs text-muted-foreground">de 5 estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">profesionales diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros ({filteredAppointments.length} sesiones)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por profesional, especialidad o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las calificaciones</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
                <SelectItem value="4">4 estrellas</SelectItem>
                <SelectItem value="3">3 estrellas</SelectItem>
                <SelectItem value="2">2 estrellas</SelectItem>
                <SelectItem value="1">1 estrella</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de citas históricas */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{appointment.professional}</h3>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{appointment.specialty}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(appointment.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time} ({appointment.duration})</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">{appointment.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(appointment.rating)}
                          <span className="text-sm ml-1">({appointment.rating}/5)</span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p><strong>Notas:</strong> {appointment.notes}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                    <Button variant="outline" size="sm">
                      Reagendar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron sesiones</h3>
                <p className="mb-4">No hay sesiones que coincidan con los filtros aplicados</p>
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

export default UserHistoricalPage;