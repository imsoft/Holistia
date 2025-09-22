import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  LucideIcon
} from "lucide-react";
import FavoriteButton from "@/components/shared/FavoriteButton";

interface Appointment {
  id: number;
  professionalId: number;
  professionalName: string;
  professionalAvatar: string;
  specialty: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  location: string;
  status: string;
  price: string;
  notes?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: number) => void;
  onReschedule: (id: number) => void;
  onCancel: (id: number) => void;
}

const getStatusIcon = (status: string): LucideIcon => {
  switch (status) {
    case 'pendiente':
      return AlertCircle;
    case 'confirmada':
      return CheckCircle;
    case 'cancelada':
      return X;
    default:
      return AlertCircle;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmada':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelada':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pendiente':
      return 'Pendiente';
    case 'confirmada':
      return 'Confirmada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return status;
  }
};

const AppointmentCard = ({ appointment, onConfirm, onReschedule, onCancel }: AppointmentCardProps) => {
  const StatusIcon = getStatusIcon(appointment.status);

  return (
    <Link href={`/professional/${appointment.professionalId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Avatar del profesional */}
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage
                  src={appointment.professionalAvatar}
                  alt={appointment.professionalName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {appointment.professionalName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              {/* Información de la cita */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{appointment.professionalName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {appointment.specialty}
                  </Badge>
                  <FavoriteButton professionalId={appointment.professionalId} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(appointment.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.time} - {appointment.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{appointment.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{appointment.price}</span>
                  </div>
                </div>

                {appointment.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/20 p-2 rounded">
                    {appointment.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2 ml-4">
              <Badge className={`${getStatusColor(appointment.status)} border`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {getStatusText(appointment.status)}
              </Badge>

              <div className="flex gap-1">
                {appointment.status === 'pendiente' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onConfirm(appointment.id);
                      }}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onReschedule(appointment.id);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Reagendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCancel(appointment.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AppointmentCard;
