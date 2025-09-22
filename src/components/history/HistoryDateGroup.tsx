import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import HistoryCard from "./HistoryCard";

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

interface HistoryDateGroupProps {
  date: string;
  appointments: Appointment[];
  onReschedule: (id: number) => void;
  onCancel: (id: number) => void;
  onRate: (id: number) => void;
  getStatusIcon: (status: string) => any;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (dateString: string) => string;
}

const HistoryDateGroup = ({ 
  date, 
  appointments, 
  onReschedule, 
  onCancel, 
  onRate,
  getStatusIcon,
  getStatusColor,
  getStatusText,
  formatDate
}: HistoryDateGroupProps) => {
  return (
    <div className="space-y-4">
      {/* Fecha */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          {formatDate(date)}
        </h2>
        <Badge variant="secondary">
          {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Citas del día */}
      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <HistoryCard
            key={appointment.id}
            appointment={appointment}
            onReschedule={onReschedule}
            onCancel={onCancel}
            onRate={onRate}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        ))}
      </div>
    </div>
  );
};

export default HistoryDateGroup;
