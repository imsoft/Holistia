'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScheduleAvailability } from '@/hooks/use-schedule-availability';

interface AvailabilityPreviewProps {
  professionalId: string;
}

interface DayData {
  date: string;
  dayName: string;
  display: string;
  timeSlots: Array<{
    time: string;
    display: string;
    fullDateTime: string;
    status: 'available' | 'occupied' | 'blocked' | 'not_offered';
  }>;
}

export function AvailabilityPreview({ professionalId }: AvailabilityPreviewProps) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { loadWeekAvailability } = useScheduleAvailability(professionalId);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7);
      // Ajustar al lunes
      const dayOfWeek = startDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + mondayOffset);

      const data = await loadWeekAvailability(startDate);
      setWeekData(data);
    } catch {
      console.error('Error loading preview data');
    } finally {
      setLoading(false);
    }
  }, [loadWeekAvailability, weekOffset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh manual con animación
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    // Mantener la animación al menos 600ms para que se vea
    setTimeout(() => setRefreshing(false), 600);
  }, [loadData]);

  // Escuchar evento reload-calendar para actualizar cuando cambian settings
  useEffect(() => {
    const handleReload = () => {
      handleRefresh();
    };
    window.addEventListener('reload-calendar', handleReload);
    return () => window.removeEventListener('reload-calendar', handleReload);
  }, [handleRefresh]);

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    occupied: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
    blocked: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    not_offered: 'bg-muted text-muted-foreground',
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Vista previa de disponibilidad
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualizar"
          >
            <RefreshCw
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-500',
                refreshing && 'animate-spin'
              )}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-4 pt-0">
        {/* Navegación semanal */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon-xs" onClick={() => setWeekOffset(prev => prev - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {weekData.length > 0
                ? `${weekData[0].display} – ${weekData[weekData.length - 1].display}`
                : 'Cargando...'}
            </span>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="xs" onClick={() => setWeekOffset(0)} className="text-xs">
                Hoy
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon-xs" onClick={() => setWeekOffset(prev => prev + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-2 mb-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-yellow-100 border border-yellow-300" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300" />
            <span>Bloqueado</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : weekData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay datos de disponibilidad para esta semana.
          </p>
        ) : (
          <div className="space-y-2">
            {weekData.map((day) => (
              <div key={day.date} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{day.display}</div>
                {day.timeSlots.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground/60 pl-1">Sin horarios</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {day.timeSlots.map((slot) => (
                      <div
                        key={slot.time}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          statusColors[slot.status]
                        )}
                      >
                        {slot.display}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
