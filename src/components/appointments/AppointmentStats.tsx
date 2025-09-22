import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface AppointmentStatsProps {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  upcomingAppointments: number;
}

const AppointmentStats = ({ 
  totalAppointments, 
  pendingAppointments, 
  confirmedAppointments, 
  upcomingAppointments 
}: AppointmentStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-foreground">{totalAppointments}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-2xl font-bold text-foreground">{pendingAppointments}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Confirmadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-2xl font-bold text-foreground">{confirmedAppointments}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Próximas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-2xl font-bold text-foreground">{upcomingAppointments}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentStats;
