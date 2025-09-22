"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Heart,
  Calendar,
  Clock,
  Star,
  MapPin,
  Plus,
  TrendingUp,
  ArrowUpRight,
  Users
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo para el dashboard de usuario
const mockData = {
  stats: {
    upcomingAppointments: 2,
    totalAppointments: 24,
    favoriteProfessionals: 5,
    averageRating: 4.9
  },
  upcomingAppointments: [
    {
      id: 1,
      professionalName: "Dra. María García",
      specialty: "Psicología Clínica",
      date: "2024-01-22",
      time: "14:00",
      location: "Consultorio Centro",
      status: "confirmada"
    },
    {
      id: 2,
      professionalName: "Dr. Carlos López",
      specialty: "Nutrición",
      date: "2024-01-25",
      time: "10:30",
      location: "Online",
      status: "pendiente"
    }
  ],
  favoriteProfessionals: [
    {
      id: 1,
      name: "Dra. María García",
      specialty: "Psicología Clínica",
      rating: 4.9,
      nextAvailable: "Mañana 09:00"
    },
    {
      id: 2,
      name: "Dr. Carlos López",
      specialty: "Nutrición",
      rating: 4.8,
      nextAvailable: "Hoy 16:00"
    }
  ]
};

const UserDashboard = () => {
  const { stats, upcomingAppointments, favoriteProfessionals } = mockData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Espacio</h1>
          <p className="text-muted-foreground">Gestiona tu salud y bienestar de manera integral</p>
        </div>
        <Button asChild>
          <Link href="/my-space">
            <Plus className="h-4 w-4 mr-2" />
            Buscar Profesional
          </Link>
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Esta semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +3 este mes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteProfessionals}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              Profesionales
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              Muy satisfecho
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas citas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{appointment.professionalName}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {appointment.specialty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })} a las {appointment.time}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {appointment.location}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver detalles
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/citas">Ver todas las citas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profesionales favoritos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Profesionales Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {favoriteProfessionals.map((professional) => (
                <div key={professional.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{professional.name}</h4>
                    <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {professional.rating}
                      <span>•</span>
                      <span>Disponible: {professional.nextAvailable}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Agendar
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/favorites">Ver todos los favoritos</Link>
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
              <Link href="/my-space">
                <Search className="h-6 w-6" />
                <span>Buscar Profesional</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/favorites">
                <Heart className="h-6 w-6" />
                <span>Ver Favoritos</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/citas">
                <Calendar className="h-6 w-6" />
                <span>Mis Citas</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
