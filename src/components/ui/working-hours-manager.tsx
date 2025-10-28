"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface WorkingHoursManagerProps {
  professionalId: string;
  userId: string;
  currentStartTime?: string;
  currentEndTime?: string;
  currentWorkingDays?: number[];
}

export function WorkingHoursManager({
  professionalId,
  currentStartTime = "09:00",
  currentEndTime = "18:00",
  currentWorkingDays = [1, 2, 3, 4, 5]
}: WorkingHoursManagerProps) {
  const [startTime, setStartTime] = useState(currentStartTime);
  const [endTime, setEndTime] = useState(currentEndTime);
  const [workingDays, setWorkingDays] = useState<number[]>(currentWorkingDays);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setStartTime(currentStartTime);
    setEndTime(currentEndTime);
    setWorkingDays(currentWorkingDays);
  }, [currentStartTime, currentEndTime, currentWorkingDays]);

  const validateTimes = () => {
    if (!startTime || !endTime) {
      toast.error("Por favor completa ambos horarios");
      return false;
    }

    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);

    if (start >= end) {
      toast.error("La hora de inicio debe ser anterior a la hora de cierre");
      return false;
    }

    // Verificar que haya al menos 1 hora de diferencia
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      toast.error("Debe haber al menos 1 hora entre el inicio y el cierre");
      return false;
    }

    if (workingDays.length === 0) {
      toast.error("Debes seleccionar al menos un día de trabajo");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateTimes()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('professional_applications')
        .update({
          working_start_time: startTime,
          working_end_time: endTime,
          working_days: workingDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', professionalId);

      if (error) {
        console.error('Error updating working hours:', error);
        toast.error("Error al guardar los horarios");
        return;
      }

      toast.success("Horarios de trabajo actualizados correctamente");
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast.error("Error al guardar los horarios");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const dayNames = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  const toggleWorkingDay = (day: number) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Horarios de Trabajo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="start-time">Hora de inicio</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              {formatTime(startTime)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-time">Hora de cierre</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              {formatTime(endTime)}
            </p>
          </div>
        </div>

        {/* Días de trabajo */}
        <div className="space-y-3">
          <Label>Días de trabajo</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dayNames.map((dayName, index) => {
              const dayNumber = index + 1;
              const isSelected = workingDays.includes(dayNumber);
              
              return (
                <div key={dayNumber} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${dayNumber}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleWorkingDay(dayNumber)}
                    disabled={saving}
                  />
                  <Label 
                    htmlFor={`day-${dayNumber}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {dayName}
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona los días de la semana en los que trabajas
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Información importante:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los pacientes solo podrán reservar citas dentro de estos horarios</li>
            <li>• Los horarios se aplican solo en los días seleccionados</li>
            <li>• Los cambios se aplican inmediatamente</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Horarios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
