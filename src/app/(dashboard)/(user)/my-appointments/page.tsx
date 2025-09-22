import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, MapPin, Phone, Star } from "lucide-react";

const mockUserAppointments = [
  {
    id: 1,
    professional: "Dr. María García",
    specialty: "Psicología Clínica",
    time: "09:00 AM",
    date: "2024-01-15",
    type: "Consulta General",
    status: "confirmed",
    address: "Calle Principal 123, Oficina 45",
    phone: "+1 234 567 8900",
    rating: 4.8
  },
  {
    id: 2,
    professional: "Dr. Carlos López",
    specialty: "Terapia Familiar",
    time: "10:30 AM",
    date: "2024-01-16",
    type: "Seguimiento",
    status: "pending",
    address: "Avenida Central 456, Consultorio 12",
    phone: "+1 234 567 8901",
    rating: 4.9
  },
  {
    id: 3,
    professional: "Dra. Ana Martínez",
    specialty: "Psicoterapia",
    time: "02:00 PM",
    date: "2024-01-17",
    type: "Sesión Individual",
    status: "confirmed",
    address: "Plaza Mayor 789, Piso 3",
    phone: "+1 234 567 8902",
    rating: 4.7
  }
];

const UserMyAppointmentsPage = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
          <p className="text-muted-foreground">Gestiona tus citas con profesionales</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Calendar className="h-4 w-4 mr-2" />
          Agendar Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">3</div>
            <p className="text-sm text-muted-foreground">citas programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">8</div>
            <p className="text-sm text-muted-foreground">citas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">2</div>
            <p className="text-sm text-muted-foreground">de 3 próximas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de citas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUserAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold">{appointment.professional}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{appointment.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.time} - {appointment.type}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{appointment.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{appointment.rating}</span>
                      <span className="text-sm text-muted-foreground">(Excelente profesional)</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                    {appointment.status === 'pending' && (
                      <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                        Cancelar
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserMyAppointmentsPage;