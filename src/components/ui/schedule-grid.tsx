'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
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
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [showAllTimes, setShowAllTimes] = useState(false);
  
  const { loading, loadWeekAvailability } = useScheduleAvailability(professionalId);

  // Cargar datos de la semana
  const loadWeekData = useCallback(async () => {
    try {
      const data = await loadWeekAvailability(currentWeek);
      setWeekData(data);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  }, [currentWeek, loadWeekAvailability]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  // Navegación entre semanas
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() - 7);
      return newWeek;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() + 7);
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
  const filteredTimeSlots = showAllTimes ? allTimeSlots : allTimeSlots.slice(0, 7);

  if (loading) {
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
            className="rounded-full w-10 h-10 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {currentWeek.toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
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
              {filteredTimeSlots.map((time) => (
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

            {/* Botón para mostrar más/menos horarios */}
            {allTimeSlots.length > 7 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTimes(!showAllTimes)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showAllTimes ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      Ver más
                      <ChevronUp className="w-4 h-4 ml-1 rotate-180" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
