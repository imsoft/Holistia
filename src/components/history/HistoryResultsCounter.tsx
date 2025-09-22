import { Badge } from "@/components/ui/badge";

interface HistoryResultsCounterProps {
  totalAppointments: number;
  filter: string;
  searchTerm: string;
  totalDays: number;
  getStatusText: (status: string) => string;
}

const HistoryResultsCounter = ({ 
  totalAppointments, 
  filter, 
  searchTerm, 
  totalDays,
  getStatusText 
}: HistoryResultsCounterProps) => {
  if (totalAppointments === 0) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {totalAppointments} cita{totalAppointments !== 1 ? 's' : ''}
        {filter !== "todas" && ` - ${getStatusText(filter).toLowerCase()}`}
        {searchTerm && ` que coinciden con "${searchTerm}"`}
      </p>
      <Badge variant="secondary">
        {totalDays} día{totalDays !== 1 ? 's' : ''}
      </Badge>
    </div>
  );
};

export default HistoryResultsCounter;
