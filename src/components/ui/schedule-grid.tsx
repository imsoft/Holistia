'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScheduleAvailability } from '@/hooks/use-schedule-availability';

interface TimeSlot {
  time: string;
  display: string;
  fullDateTime: string;
  status: 'available' | 'occupied' | 'blocked' | 'not_offered';
}

interface DayData {
  date: string;
  dayName: string;
  display: string;
  timeSlots: TimeSlot[];
}

interface ScheduleGridProps {
  professionalId: string;
  onTimeSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  className?: string;
}

export function ScheduleGrid({ 
  professionalId, 
  onTimeSelect, 
  selectedDate, 
  selectedTime,
  className 
}: ScheduleGridProps) {
  // Inicializar desde hoy, asegurando que se muestre desde la fecha actual
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    return today;
  });
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [cache, setCache] = useState<Map<string, DayData[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  
  const { loadWeekAvailability } = useScheduleAvailability(professionalId);

  // Generar clave de caché para la semana
  const getWeekKey = useCallback((date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  }, []);

  // Cargar datos de la semana con caché
  const loadWeekData = useCallback(async (weekDate: Date, useCache = true) => {
    const weekKey = getWeekKey(weekDate);
    
    // Verificar caché primero
    if (useCache && cache.has(weekKey)) {
      setWeekData(cache.get(weekKey)!);
      return;
    }

    setIsLoading(true);
    try {
      const data = await loadWeekAvailability(weekDate);
      setWeekData(data);
      
      // Guardar en caché
      setCache(prev => new Map(prev).set(weekKey, data));
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getWeekKey, cache, loadWeekAvailability]);

  // Cargar datos iniciales
  useEffect(() => {
    loadWeekData(currentWeek);
  }, [professionalId, currentWeek, loadWeekData]); // Cargar cuando cambie el profesional o la semana

  // Precargar semanas adyacentes
  const preloadAdjacentWeeks = useCallback(() => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    
    // Precargar en segundo plano
    loadWeekData(prevWeek, true);
    loadWeekData(nextWeek, true);
  }, [currentWeek, loadWeekData]);

  // Precargar cuando se carga la semana actual
  useEffect(() => {
    if (weekData.length > 0) {
      preloadAdjacentWeeks();
    }
  }, [weekData.length, preloadAdjacentWeeks]);

  // Navegación entre semanas
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() - 7);
      loadWeekData(newWeek);
      return newWeek;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() + 7);
      loadWeekData(newWeek);
      return newWeek;
    });
  };


  // Obtener horarios únicos para las filas
  const getAllTimeSlots = () => {
    const allTimes = new Set<string>();
    weekData.forEach(day => {
      day.timeSlots.forEach(slot => allTimes.add(slot.time));
    });
    return Array.from(allTimes).sort();
  };

  const allTimeSlots = getAllTimeSlots();

  // Solo mostrar loading en la carga inicial
  if (weekData.length === 0 && isLoading) {
    return (
      <Card className={className}>
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
    <Card className={className}>
      <CardContent className="p-6">
        {/* Navegación */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            disabled={isLoading}
            className="rounded-full w-10 h-10 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {currentWeek.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            disabled={isLoading}
            className="rounded-full w-10 h-10 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Grilla de horarios */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Encabezados de días */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="w-16"></div> {/* Columna vacía para las horas */}
              {weekData.map((day) => (
                <div key={day.date} className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">
                    {day.dayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.display.split(' ')[1]} {day.display.split(' ')[2]}
                  </div>
                </div>
              ))}
            </div>

            {/* Filas de horarios */}
            <div className="space-y-1">
              {allTimeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-1">
                  {/* Hora */}
                  <div className="w-16 flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {time}
                    </span>
                  </div>
                  
                  {/* Celdas de disponibilidad */}
                  {weekData.map((day) => {
                    const timeSlot = day.timeSlots.find(slot => slot.time === time);
                    const isSelected = selectedDate === day.date && selectedTime === time;
                    
                    return (
                      <div key={`${day.date}-${time}`} className="h-10">
                        {timeSlot ? (
                          <button
                            onClick={() => {
                              if (timeSlot.status === 'available') {
                                onTimeSelect(day.date, time);
                              }
                            }}
                            disabled={timeSlot.status !== 'available'}
                            className={cn(
                              "w-full h-full rounded-md border-2 transition-all text-sm font-medium",
                              "hover:shadow-sm disabled:cursor-not-allowed",
                              {
                                // Disponible
                                "border-blue-500 bg-blue-500 text-white hover:bg-blue-600": 
                                  timeSlot.status === 'available' && isSelected,
                                "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200": 
                                  timeSlot.status === 'available' && !isSelected,
                                
                                // Ocupado
                                "border-gray-300 bg-gray-100 text-gray-500 line-through": 
                                  timeSlot.status === 'occupied',
                                
                                // Bloqueado
                                "border-orange-300 bg-orange-100 text-orange-500 line-through": 
                                  timeSlot.status === 'blocked',
                                
                                // No ofrecido
                                "border-gray-200 bg-gray-50 text-gray-400": 
                                  timeSlot.status === 'not_offered',
                              }
                            )}
                          >
                            {timeSlot.status === 'available' ? time : '-'}
                          </button>
                        ) : (
                          <div className="w-full h-full rounded-md border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}
