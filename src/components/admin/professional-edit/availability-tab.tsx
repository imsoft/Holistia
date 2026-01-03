"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";

interface AvailabilityTabProps {
  professionalId: string;
}

const DAYS_OF_WEEK = [
  { day: 1, name: 'Lunes' },
  { day: 2, name: 'Martes' },
  { day: 3, name: 'Miércoles' },
  { day: 4, name: 'Jueves' },
  { day: 5, name: 'Viernes' },
  { day: 6, name: 'Sábado' },
  { day: 7, name: 'Domingo' },
];

export function AvailabilityTab({ professionalId }: AvailabilityTabProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<number[]>([]);
  const [workingStartTime, setWorkingStartTime] = useState("09:00");
  const [workingEndTime, setWorkingEndTime] = useState("18:00");

  useEffect(() => {
    fetchAvailability();
  }, [professionalId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_applications')
        .select('working_days, working_start_time, working_end_time')
        .eq('id', professionalId)
        .single();

      if (error) throw error;

      if (data) {
        setWorkingDays(data.working_days || [1, 2, 3, 4, 5]);
        setWorkingStartTime(data.working_start_time || '09:00');
        setWorkingEndTime(data.working_end_time || '18:00');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Error al cargar la disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('professional_applications')
        .update({
          working_days: workingDays,
          working_start_time: workingStartTime,
          working_end_time: workingEndTime,
        })
        .eq('id', professionalId);

      if (error) throw error;
      toast.success('Disponibilidad actualizada exitosamente');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardContent className="py-12">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Horarios de Trabajo</CardTitle>
          <CardDescription>Configura los días y horarios en que el profesional está disponible</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Working Days */}
          <div className="space-y-3">
            <Label>Días de Trabajo</Label>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(({ day, name }) => (
                <div key={day} className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor={`day-${day}`} className="cursor-pointer flex-1">
                    {name}
                  </Label>
                  <Switch
                    id={`day-${day}`}
                    checked={workingDays.includes(day)}
                    onCheckedChange={() => toggleWorkingDay(day)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de Inicio</Label>
              <Input
                id="start_time"
                type="time"
                value={workingStartTime}
                onChange={(e) => setWorkingStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de Fin</Label>
              <Input
                id="end_time"
                type="time"
                value={workingEndTime}
                onChange={(e) => setWorkingEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
