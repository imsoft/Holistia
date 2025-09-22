import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MapPin, 
  Star, 
  Calendar,
  XCircle,
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
  status: string;
  location: string;
  price: string;
  notes?: string;
  rating?: number;
  review?: string;
  cancellationReason?: string;
}

interface HistoryCardProps {
  appointment: Appointment;
  onReschedule: (id: number) => void;
  onCancel: (id: number) => void;
  onRate: (id: number) => void;
  getStatusIcon: (status: string) => LucideIcon;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const HistoryCard = ({ 
  appointment, 
  onReschedule, 
  onCancel, 
  onRate,
  getStatusIcon,
  getStatusColor,
  getStatusText
}: HistoryCardProps) => {
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
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {appointment.professionalName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              {/* Información de la cita */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {appointment.professionalName}
                    </h3>
                    <p className="text-muted-foreground">{appointment.specialty}</p>
                  </div>
                  <Badge className={`${getStatusColor(appointment.status)} border`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>

                {/* Detalles de la cita */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.time} - {appointment.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{appointment.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-semibold text-primary">{appointment.price}</span>
                  </div>
                </div>

                {/* Notas */}
                {appointment.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {appointment.notes}
                  </p>
                )}

                {/* Razón de cancelación */}
                {appointment.status === 'cancelada' && appointment.cancellationReason && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    <strong>Razón:</strong> {appointment.cancellationReason}
                  </p>
                )}

                {/* Reseña */}
                {appointment.status === 'completada' && appointment.review && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-green-800">
                        Tu reseña ({appointment.rating}/5)
                      </span>
                    </div>
                    <p className="text-sm text-green-700">{appointment.review}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2 ml-4">
              <FavoriteButton professionalId={appointment.professionalId} />
              
              {appointment.status === 'pendiente' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onReschedule(appointment.id);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
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
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </>
              )}
              
              {appointment.status === 'completada' && !appointment.review && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRate(appointment.id);
                  }}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Calificar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default HistoryCard;
