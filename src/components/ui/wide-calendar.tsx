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

interface WideCalendarProps {
  professionalId: string;
  onTimeSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  className?: string;
}

export function WideCalendar({ 
  professionalId, 
  onTimeSelect, 
  selectedDate, 
  selectedTime,
  className 
}: WideCalendarProps) {
  // Inicializar desde hoy
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
  }, [professionalId, currentWeek, loadWeekData]);

  // Navegación de semanas
  const goToPreviousWeek = useCallback(() => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
    loadWeekData(prevWeek);
  }, [currentWeek, loadWeekData]);

  const goToNextWeek = useCallback(() => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
    loadWeekData(nextWeek);
  }, [currentWeek, loadWeekData]);


  // Obtener horarios dinámicamente basados en los horarios de trabajo del profesional
  const getTimeSlots = useCallback(() => {
    if (weekData.length === 0) return [];
    
    // Obtener el rango de horarios de los datos de la semana
    const allSlots = new Set<string>();
    weekData.forEach(day => {
      day.timeSlots.forEach(slot => {
        allSlots.add(slot.time);
      });
    });
    
    // Convertir a array y ordenar
    return Array.from(allSlots).sort();
  }, [weekData]);

  const allTimeSlots = getTimeSlots();

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
          
          <div className="flex items-center gap-2">
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
        </div>

        {/* Grid de horarios */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header con días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekData.map((day) => (
                <div key={day.date} className="text-center py-2">
                  <div className="text-sm font-medium text-foreground">
                    {day.dayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.display}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de horarios */}
            <div className="space-y-1">
              {allTimeSlots.map((time) => (
                <div key={time} className="grid grid-cols-7 gap-2">
                  {/* Columnas de días */}
                  {weekData.map((day) => {
                    const timeSlot = day.timeSlots.find(slot => slot.time === time);
                    const isSelected = selectedDate === day.date && selectedTime === time;

                    return (
                      <div key={`${day.date}-${time}`} className="h-12">
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
                            <span className="text-gray-400 text-xs">-</span>
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

        {/* Leyenda */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-blue-200 bg-blue-100"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-gray-300 bg-gray-100"></div>
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-orange-300 bg-orange-100"></div>
            <span>Bloqueado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-gray-200 bg-gray-50"></div>
            <span>No disponible</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
