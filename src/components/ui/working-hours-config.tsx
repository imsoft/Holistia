'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { HourSelector } from '@/components/ui/hour-selector';

interface WorkingHoursConfigProps {
  professionalId: string;
  onSave?: () => void;
}

interface DaySchedule {
  day: number; // 1-7 (Lunes-Domingo)
  dayName: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = [
  { day: 1, name: 'Lunes', shortName: 'Lun' },
  { day: 2, name: 'Martes', shortName: 'Mar' },
  { day: 3, name: 'Miércoles', shortName: 'Mié' },
  { day: 4, name: 'Jueves', shortName: 'Jue' },
  { day: 5, name: 'Viernes', shortName: 'Vie' },
  { day: 6, name: 'Sábado', shortName: 'Sáb' },
  { day: 7, name: 'Domingo', shortName: 'Dom' },
];

export function WorkingHoursConfig({ professionalId, onSave }: WorkingHoursConfigProps) {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSchedules, setOriginalSchedules] = useState<DaySchedule[]>([]);

  // Inicializar horarios por defecto
  const initializeSchedules = useCallback(() => {
    const defaultSchedules: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
      day: day.day,
      dayName: day.name,
      isWorking: day.day <= 5, // Lunes a Viernes por defecto
      startTime: '09:00',
      endTime: '18:00',
    }));
    setSchedules(defaultSchedules);
    setOriginalSchedules([...defaultSchedules]);
  }, []);

  // Cargar horarios existentes
  const loadWorkingHours = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('professional_applications')
        .select('working_days, working_start_time, working_end_time')
        .eq('id', professionalId)
        .single();

      if (error) throw error;

      if (data) {
        const workingDays = data.working_days || [];
        const startTime = data.working_start_time || '09:00';
        const endTime = data.working_end_time || '18:00';

        const loadedSchedules: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
          day: day.day,
          dayName: day.name,
          isWorking: workingDays.includes(day.day),
          startTime: workingDays.includes(day.day) ? startTime : '09:00',
          endTime: workingDays.includes(day.day) ? endTime : '18:00',
        }));

        setSchedules(loadedSchedules);
        setOriginalSchedules([...loadedSchedules]);
      } else {
        initializeSchedules();
      }
    } catch (error) {
      console.error('Error loading working hours:', error);
      toast.error('Error al cargar los horarios de trabajo');
      initializeSchedules();
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase, initializeSchedules]);

  useEffect(() => {
    loadWorkingHours();
  }, [loadWorkingHours]);

  // Detectar cambios
  useEffect(() => {
    const hasChanges = JSON.stringify(schedules) !== JSON.stringify(originalSchedules);
    setHasChanges(hasChanges);
  }, [schedules, originalSchedules]);

  const updateSchedule = (day: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.day === day 
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const toggleWorkingDay = (day: number) => {
    const schedule = schedules.find(s => s.day === day);
    if (schedule) {
      updateSchedule(day, 'isWorking', !schedule.isWorking);
    }
  };

  const handleTimeChange = (day: number, timeType: 'startTime' | 'endTime', value: string) => {
    updateSchedule(day, timeType, value);
    
    // Si cambia la hora de inicio, ajustar la hora de fin si es necesario
    if (timeType === 'startTime') {
      const schedule = schedules.find(s => s.day === day);
      if (schedule && value >= schedule.endTime) {
        const [hour] = value.split(':').map(Number);
        const newEndTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        updateSchedule(day, 'endTime', newEndTime);
      }
    }
  };

  const applyToAllWorkingDays = (field: 'startTime' | 'endTime', value: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.isWorking 
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const resetToDefaults = () => {
    initializeSchedules();
    toast.success('Horarios restaurados a los valores por defecto');
  };

  const saveWorkingHours = async () => {
    setSaving(true);
    try {
      const workingDays = schedules
        .filter(s => s.isWorking)
        .map(s => s.day)
        .sort();

      // Obtener horarios de los días laborales
      const workingSchedules = schedules.filter(s => s.isWorking);
      const startTime = workingSchedules.length > 0 ? workingSchedules[0].startTime : '09:00';
      const endTime = workingSchedules.length > 0 ? workingSchedules[0].endTime : '18:00';

      // Verificar si todos los días laborales tienen el mismo horario
      const allSameHours = workingSchedules.every(s => 
        s.startTime === startTime && s.endTime === endTime
      );

      if (allSameHours) {
        // Usar el formato original (working_days, working_start_time, working_end_time)
        const { error } = await supabase
          .from('professional_applications')
          .update({
            working_days: workingDays,
            working_start_time: startTime,
            working_end_time: endTime,
          })
          .eq('id', professionalId);

        if (error) throw error;
      } else {
        // Si hay horarios diferentes por día, necesitamos una nueva estructura
        // Por ahora, usar el horario más común o el primero
        const { error } = await supabase
          .from('professional_applications')
          .update({
            working_days: workingDays,
            working_start_time: startTime,
            working_end_time: endTime,
          })
          .eq('id', professionalId);

        if (error) throw error;
      }

      setOriginalSchedules([...schedules]);
      setHasChanges(false);
      toast.success('Horarios de trabajo guardados correctamente');
      onSave?.();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast.error('Error al guardar los horarios de trabajo');
    } finally {
      setSaving(false);
    }
  };

  const getWorkingDaysCount = () => {
    return schedules.filter(s => s.isWorking).length;
  };

  const getTotalWorkingHours = () => {
    const workingSchedules = schedules.filter(s => s.isWorking);
    if (workingSchedules.length === 0) return 0;

    let totalMinutes = 0;
    workingSchedules.forEach(schedule => {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      totalMinutes += endMinutes - startMinutes;
    });

    return Math.round(totalMinutes / 60 * 10) / 10; // Redondear a 1 decimal
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-base text-muted-foreground">Cargando horarios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Horarios de Trabajo</h2>
          <p className="text-muted-foreground">
            Configura tus horarios de disponibilidad para cada día de la semana
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <Button 
            onClick={saveWorkingHours} 
            disabled={!hasChanges || saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Días Laborales</p>
                <p className="text-lg font-bold">{getWorkingDaysCount()}/7 días</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Horas Totales</p>
                <p className="text-lg font-bold">{getTotalWorkingHours()}h/semana</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium">Estado</p>
                <p className="text-lg font-bold">
                  {hasChanges ? 'Cambios pendientes' : 'Guardado'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración por día */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule.day} className={cn(
            "transition-all",
            schedule.isWorking ? "border-green-200 bg-green-50/50" : "border-gray-200"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={schedule.isWorking}
                      onCheckedChange={() => toggleWorkingDay(schedule.day)}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{schedule.dayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {schedule.isWorking ? 'Día laboral' : 'Día libre'}
                      </p>
                    </div>
                  </div>
                  
                  {schedule.isWorking && (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Activo
                    </Badge>
                  )}
                </div>

                {schedule.isWorking && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Inicio:</Label>
                      <HourSelector
                        id={`start-${schedule.day}`}
                        label=""
                        value={schedule.startTime}
                        onChange={(value) => handleTimeChange(schedule.day, 'startTime', value)}
                        startHour={6}
                        endHour={22}
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Fin:</Label>
                      <HourSelector
                        id={`end-${schedule.day}`}
                        label=""
                        value={schedule.endTime}
                        onChange={(value) => handleTimeChange(schedule.day, 'endTime', value)}
                        startHour={parseInt(schedule.startTime.split(':')[0]) + 1}
                        endHour={23}
                        className="w-24"
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                        const startMinutes = startHour * 60 + startMin;
                        const endMinutes = endHour * 60 + endMin;
                        const totalMinutes = endMinutes - startMinutes;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acciones rápidas */}
      {schedules.some(s => s.isWorking) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Aplicar horario a todos los días laborales:</Label>
                <HourSelector
                  id="quick-start"
                  label=""
                  value="09:00"
                  onChange={(value) => applyToAllWorkingDays('startTime', value)}
                  startHour={6}
                  endHour={22}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">a</span>
                <HourSelector
                  id="quick-end"
                  label=""
                  value="18:00"
                  onChange={(value) => applyToAllWorkingDays('endTime', value)}
                  startHour={7}
                  endHour={23}
                  className="w-24"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Los horarios configurados se aplicarán a tu disponibilidad para citas</li>
                <li>• Los pacientes solo podrán agendar en los días y horarios que configures</li>
                <li>• Puedes cambiar estos horarios en cualquier momento</li>
                <li>• Los bloqueos de disponibilidad tienen prioridad sobre estos horarios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
