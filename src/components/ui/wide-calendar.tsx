'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScheduleAvailability } from '@/hooks/use-schedule-availability';
import { formatLocalDate } from '@/lib/date-utils';

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
  // Inicializar desde el domingo de esta semana
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return startOfWeek;
  });
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar viewport mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Usar ref para caché para evitar que actualizaciones del caché
  // disparen re-renders y re-fires del useEffect
  const cacheRef = useRef<Map<string, DayData[]>>(new Map());

  // Contador de versión para descartar resultados de cargas obsoletas
  const loadVersionRef = useRef(0);

  const { loadWeekAvailability } = useScheduleAvailability(professionalId);

  // Generar clave de caché para la semana (incluye professionalId para evitar datos cruzados)
  const getWeekKey = useCallback((date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return `${professionalId}:${formatLocalDate(startOfWeek)}`;
  }, [professionalId]);

  // Cargar datos de la semana con caché y protección contra race conditions
  const loadWeekData = useCallback(async (weekDate: Date, useCache = true) => {
    const weekKey = getWeekKey(weekDate);

    // Verificar caché primero
    if (useCache && cacheRef.current.has(weekKey)) {
      console.log('📦 Usando datos del caché para:', weekKey);
      setWeekData(cacheRef.current.get(weekKey)!);
      return;
    }

    // Incrementar versión para invalidar cargas anteriores en curso
    const thisVersion = ++loadVersionRef.current;

    console.log('🔍 Cargando datos frescos para:', weekKey, 'versión:', thisVersion);
    setIsLoading(true);
    try {
      const data = await loadWeekAvailability(weekDate);

      // Solo aplicar si esta carga sigue siendo la más reciente
      if (loadVersionRef.current !== thisVersion) {
        console.log('⏭️ Descartando resultado obsoleto, versión:', thisVersion, 'actual:', loadVersionRef.current);
        return;
      }

      setWeekData(data);
      // Guardar en caché (ref, no dispara re-render)
      cacheRef.current.set(weekKey, data);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      // Solo quitar loading si esta carga sigue siendo la más reciente
      if (loadVersionRef.current === thisVersion) {
        setIsLoading(false);
      }
    }
  }, [getWeekKey, loadWeekAvailability]);

  // Precargar semanas adyacentes para mejorar la experiencia
  // IMPORTANTE: El preload solo actualiza el caché, nunca weekData
  const preloadAdjacentWeeks = useCallback((weekDate: Date) => {
    const prevWeek = new Date(weekDate);
    prevWeek.setDate(weekDate.getDate() - 7);
    const nextWeek = new Date(weekDate);
    nextWeek.setDate(weekDate.getDate() + 7);

    const prevWeekKey = getWeekKey(prevWeek);
    const nextWeekKey = getWeekKey(nextWeek);

    // Precargar en segundo plano, sin afectar el estado principal
    if (!cacheRef.current.has(prevWeekKey)) {
      loadWeekAvailability(prevWeek).then(data => {
        // Solo guardar en caché si no se ha navegado a otra semana
        if (data && data.length > 0) {
          cacheRef.current.set(prevWeekKey, data);
        }
      }).catch(() => {/* Ignorar errores de preload */});
    }

    if (!cacheRef.current.has(nextWeekKey)) {
      loadWeekAvailability(nextWeek).then(data => {
        // Solo guardar en caché si no se ha navegado a otra semana
        if (data && data.length > 0) {
          cacheRef.current.set(nextWeekKey, data);
        }
      }).catch(() => {/* Ignorar errores de preload */});
    }
  }, [getWeekKey, loadWeekAvailability]);

  // Limpiar caché al montar el componente (forzar datos frescos en cada visita)
  useEffect(() => {
    console.log('🔄 Wide Calendar montado - limpiando caché para garantizar datos frescos');
    console.log('🔄 VERSION: 2026-02-11-DEBUG-v2'); // Para verificar que el código nuevo se está ejecutando
    cacheRef.current = new Map();
  }, []);

  // Cargar datos cuando cambia el profesional o la semana
  useEffect(() => {
    loadWeekData(currentWeek);
    // Precargar semanas adyacentes después de un breve delay
    const timer = setTimeout(() => preloadAdjacentWeeks(currentWeek), 200);
    return () => clearTimeout(timer);
  }, [professionalId, currentWeek, loadWeekData, preloadAdjacentWeeks]);

  // Listener para recargar cuando se actualicen bloqueos
  useEffect(() => {
    const handleReload = () => {
      console.log('🔄 Evento de recarga detectado, limpiando caché del calendario...');
      cacheRef.current = new Map();
      loadWeekData(currentWeek, false);
    };

    window.addEventListener('reload-calendar', handleReload);
    return () => window.removeEventListener('reload-calendar', handleReload);
  }, [currentWeek, loadWeekData]);

  // Navegación de semanas
  const goToPreviousWeek = useCallback(() => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
    setSelectedDayIndex(0);
  }, [currentWeek]);

  const goToNextWeek = useCallback(() => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
    setSelectedDayIndex(0);
  }, [currentWeek]);


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
            <span className="ml-3 inline-block h-4 w-32 bg-muted rounded animate-pulse" />
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
              {currentWeek.toLocaleDateString('es-MX', {
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            {isLoading && (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                <span className="inline-block h-3 w-20 bg-muted rounded animate-pulse" />
              </div>
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

        {/* Vista móvil: un día a la vez con tabs */}
        {isMobile ? (
          <div className="space-y-4">
            {/* Tabs de días */}
            <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
              {weekData.map((day, index) => {
                const today = formatLocalDate(new Date());
                const isToday = day.date === today;
                const hasAvailable = day.timeSlots.some(s => s.status === 'available');

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDayIndex(index)}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 rounded-lg border-2 transition-all text-center min-w-[60px]",
                      selectedDayIndex === index
                        ? "border-primary bg-primary text-primary-foreground"
                        : isToday
                          ? "border-blue-200 bg-blue-50"
                          : hasAvailable
                            ? "border-border bg-background hover:bg-accent"
                            : "border-muted bg-muted/50 opacity-60"
                    )}
                  >
                    <div className="text-xs font-medium">{day.dayName}</div>
                    <div className="text-sm font-bold">{day.display.split(' ')[1]}</div>
                  </button>
                );
              })}
            </div>

            {/* Slots del día seleccionado */}
            {weekData[selectedDayIndex] && (
              <div>
                <p className="text-sm font-medium text-center mb-3">
                  {weekData[selectedDayIndex].display}
                </p>
                {weekData[selectedDayIndex].timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay horarios disponibles este día.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {weekData[selectedDayIndex].timeSlots.map((slot) => {
                      const day = weekData[selectedDayIndex];
                      const isSelected = selectedDate === day.date && selectedTime === slot.time;

                      return (
                        <button
                          key={slot.time}
                          onClick={() => {
                            if (slot.status === 'available') {
                              onTimeSelect(day.date, slot.time);
                            }
                          }}
                          disabled={slot.status !== 'available'}
                          className={cn(
                            "h-12 rounded-md border-2 transition-all text-sm font-medium",
                            "disabled:cursor-not-allowed",
                            {
                              "border-blue-500 bg-blue-500 text-white":
                                slot.status === 'available' && isSelected,
                              "border-blue-200 bg-blue-100 text-blue-700 active:bg-blue-200":
                                slot.status === 'available' && !isSelected,
                              "border-gray-300 bg-gray-100 text-gray-500 line-through":
                                slot.status === 'occupied',
                              "border-orange-300 bg-orange-100 text-orange-500 line-through":
                                slot.status === 'blocked',
                              "border-gray-200 bg-gray-50 text-gray-400":
                                slot.status === 'not_offered',
                            }
                          )}
                        >
                          {slot.status === 'available' ? slot.time : '-'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Vista desktop: grid de 7 columnas */
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header con días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekData.map((day) => {
                  const today = formatLocalDate(new Date());
                  const isToday = day.date === today;

                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "text-center py-2 rounded-lg transition-colors",
                        isToday && "bg-blue-50 border-2 border-blue-200"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium",
                        isToday ? "text-blue-600" : "text-foreground"
                      )}>
                        {day.dayName}
                      </div>
                      <div className={cn(
                        "text-xs",
                        isToday ? "text-blue-500 font-medium" : "text-muted-foreground"
                      )}>
                        {day.display}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid de horarios */}
              <div className="space-y-1">
                {allTimeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-7 gap-2">
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
                                  "border-blue-500 bg-blue-500 text-white hover:bg-blue-600":
                                    timeSlot.status === 'available' && isSelected,
                                  "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200":
                                    timeSlot.status === 'available' && !isSelected,
                                  "border-gray-300 bg-gray-100 text-gray-500 line-through":
                                    timeSlot.status === 'occupied',
                                  "border-orange-300 bg-orange-100 text-orange-500 line-through":
                                    timeSlot.status === 'blocked',
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
        )}

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
