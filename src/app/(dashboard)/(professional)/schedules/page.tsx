"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock,
  Calendar,
  Settings,
  Plus,
  CheckCircle,
  XCircle
} from "lucide-react";

// Datos de ejemplo para horarios
const mockSchedule = {
  workingHours: {
    monday: { start: "09:00", end: "17:00", available: true },
    tuesday: { start: "09:00", end: "17:00", available: true },
    wednesday: { start: "09:00", end: "17:00", available: true },
    thursday: { start: "09:00", end: "17:00", available: true },
    friday: { start: "09:00", end: "17:00", available: true },
    saturday: { start: "09:00", end: "13:00", available: false },
    sunday: { start: "09:00", end: "13:00", available: false }
  },
  timeSlots: [
    { id: 1, time: "09:00", duration: "30 min", available: true },
    { id: 2, time: "09:30", duration: "30 min", available: true },
    { id: 3, time: "10:00", duration: "30 min", available: false },
    { id: 4, time: "10:30", duration: "30 min", available: true },
    { id: 5, time: "11:00", duration: "30 min", available: true },
    { id: 6, time: "11:30", duration: "30 min", available: false },
    { id: 7, time: "12:00", duration: "30 min", available: true },
    { id: 8, time: "12:30", duration: "30 min", available: true },
    { id: 9, time: "13:00", duration: "30 min", available: false },
    { id: 10, time: "13:30", duration: "30 min", available: false },
    { id: 11, time: "14:00", duration: "30 min", available: true },
    { id: 12, time: "14:30", duration: "30 min", available: true },
    { id: 13, time: "15:00", duration: "30 min", available: true },
    { id: 14, time: "15:30", duration: "30 min", available: true },
    { id: 15, time: "16:00", duration: "30 min", available: false },
    { id: 16, time: "16:30", duration: "30 min", available: true }
  ]
};

const SchedulesPage = () => {
  const { workingHours, timeSlots } = mockSchedule;

  const getDayName = (day: string) => {
    const days = {
      monday: "Lunes",
      tuesday: "Martes", 
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
      sunday: "Domingo"
    };
    return days[day as keyof typeof days];
  };

  const getSlotStatusIcon = (available: boolean) => {
    return available ? CheckCircle : XCircle;
  };

  const getSlotStatusColor = (available: boolean) => {
    return available 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Horarios</h1>
          <p className="text-muted-foreground">Configura tu disponibilidad y horarios de trabajo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Disponibilidad
          </Button>
        </div>
      </div>

      {/* Resumen de horarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(workingHours).filter(day => day.available).length}
            </div>
            <p className="text-xs text-muted-foreground">días por semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">40</div>
            <p className="text-xs text-muted-foreground">horas por semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slots Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeSlots.filter(slot => slot.available).length}
            </div>
            <p className="text-xs text-muted-foreground">de {timeSlots.length} slots</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Horarios de trabajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horarios de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(workingHours).map(([day, schedule]) => {
                const StatusIcon = schedule.available ? CheckCircle : XCircle;
                const statusColor = schedule.available 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-100 text-gray-800 border-gray-200";
                
                return (
                  <div key={day} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{getDayName(day)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {schedule.available ? (
                        <span className="text-sm text-muted-foreground">
                          {schedule.start} - {schedule.end}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No disponible</span>
                      )}
                      <Badge className={`${statusColor} border`}>
                        {schedule.available ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Slots de tiempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Slots de Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const StatusIcon = getSlotStatusIcon(slot.available);
                const statusColor = getSlotStatusColor(slot.available);
                
                return (
                  <div key={slot.id} className={`p-2 border rounded-lg text-center ${statusColor} border`}>
                    <StatusIcon className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs font-medium">{slot.time}</div>
                    <div className="text-xs opacity-75">{slot.duration}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>Editar Horarios</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Clock className="h-6 w-6" />
              <span>Gestionar Slots</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>Configuración Avanzada</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulesPage;