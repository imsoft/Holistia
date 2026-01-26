'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Edit, Trash2, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { formatDate, parseLocalDate, formatLocalDate } from '@/lib/date-utils';
import type { AvailabilityBlock } from '@/types/availability';
import { deleteBlockFromGoogleCalendar, syncAllBlocksToGoogleCalendar } from '@/actions/google-calendar';
import { syncGoogleCalendarEvents } from '@/actions/google-calendar/sync';

interface BlocksCalendarViewProps {
  professionalId: string;
  userId?: string;
  onEditBlock?: (block: AvailabilityBlock) => void;
  onDeleteBlock?: (blockId: string) => void;
  onCreateBlock?: () => void;
}

export function BlocksCalendarView({
  professionalId,
  userId,
  onEditBlock,
  onDeleteBlock,
  onCreateBlock
}: BlocksCalendarViewProps) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  const didAutoSyncRef = useRef(false);

  // Cargar bloqueos
  const fetchBlocks = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      console.log('🔍 Blocks fetched:', data);
      console.log('📊 Blocks summary:', data?.map(b => ({
        title: b.title,
        type: b.block_type,
        day_of_week: b.day_of_week,
        is_recurring: b.is_recurring,
        start_date: b.start_date
      })));
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Error al cargar los bloqueos');
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Auto-import suave: traer eventos de Google al abrir /availability (una vez por montaje)
  useEffect(() => {
    if (!userId) return;
    if (didAutoSyncRef.current) return;
    didAutoSyncRef.current = true;

    syncGoogleCalendarEvents(userId)
      .then((result) => {
        if (result.success) {
          // No spamear toasts si no hubo cambios; solo refrescar.
          fetchBlocks();
        }
      })
      .catch((err) => {
        console.warn('⚠️ No se pudo importar desde Google Calendar:', err);
      });
  }, [userId, fetchBlocks]);

  // Listener para recargar cuando se cree/actualice un bloqueo
  useEffect(() => {
    const handleReload = () => {
      console.log('🔄 Evento de recarga detectado en blocks-calendar-view');
      fetchBlocks();
    };

    window.addEventListener('reload-calendar', handleReload);
    return () => window.removeEventListener('reload-calendar', handleReload);
  }, [fetchBlocks]);

  // Generar días del mes
  const generateMonthDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date: formatLocalDate(date),
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      days.push({
        date: formatLocalDate(date),
        dayNumber: day,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: formatLocalDate(date),
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [currentMonth]);

  const monthDays = generateMonthDays();

  // Obtener bloqueos para una fecha específica
  const getBlocksForDate = (date: string) => {
    // Crear fecha en hora local para evitar problemas de zona horaria
    const currentDate = parseLocalDate(date);
    const dayOfWeekCurrent = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

    console.log('🔍 getBlocksForDate called:', { date, dayOfWeekCurrent, totalBlocks: blocks.length });

    return blocks.filter(block => {
      if (block.block_type === 'full_day') {
        return block.start_date <= date && (!block.end_date || block.end_date >= date);
      } else if (block.block_type === 'time_range') {
        return block.start_date <= date && (!block.end_date || block.end_date >= date);
      } else if (block.block_type === 'weekly_day') {
        // Bloqueo de día completo (puede ser recurrente o de una sola vez)
        const matchesDayOfWeek = block.day_of_week === dayOfWeekCurrent;

        if (block.is_recurring) {
          // Recurrente: Aplica a TODAS las ocurrencias del día de la semana, sin importar la fecha
          const applies = matchesDayOfWeek;
          console.log('📅 [RECURRING] weekly_day:', {
            date,
            dayOfWeekCurrent,
            blockDayOfWeek: block.day_of_week,
            matchesDayOfWeek,
            isRecurring: block.is_recurring,
            applies,
            blockTitle: block.title
          });
          return applies;
        } else {
          // No recurrente: Solo aplica a la fecha específica en start_date
          const applies = matchesDayOfWeek && block.start_date === date;
          if (date.startsWith('2025-11-')) {
            console.log('📅 Checking weekly_day block (one-time):', {
              date,
              dayOfWeekCurrent,
              blockDayOfWeek: block.day_of_week,
              blockStartDate: block.start_date,
              isRecurring: block.is_recurring,
              applies,
              blockTitle: block.title
            });
          }
          return applies;
        }
      } else if (block.block_type === 'weekly_range') {
        // Bloqueo de rango de horas (puede ser recurrente o de una sola vez)
        const blockStartDate = parseLocalDate(block.start_date);
        const blockEndDate = block.end_date ? parseLocalDate(block.end_date) : null;
        const dayOfWeekStart = blockStartDate.getDay() === 0 ? 7 : blockStartDate.getDay();
        const dayOfWeekEnd = blockEndDate ? (blockEndDate.getDay() === 0 ? 7 : blockEndDate.getDay()) : dayOfWeekStart;

        // Verificar si el día actual está en el rango de días de la semana
        const isInWeekRange = dayOfWeekCurrent >= dayOfWeekStart && dayOfWeekCurrent <= dayOfWeekEnd;

        if (block.is_recurring) {
          // Recurrente: Aplica a TODAS las ocurrencias dentro del rango de días, sin importar la fecha
          return isInWeekRange;
        } else {
          // No recurrente: Solo aplica dentro del rango de fechas específicas
          const isInDateRange = block.start_date <= date && (!block.end_date || block.end_date >= date);
          return isInWeekRange && isInDateRange;
        }
      }
      return false;
    });
  };

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Sincronizar bloqueos con Google Calendar
  const handleSyncWithGoogleCalendar = async () => {
    if (!userId) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncAllBlocksToGoogleCalendar(userId);

      if (result.success) {
        if (result.syncedCount && result.syncedCount > 0) {
          toast.success(`✅ ${result.syncedCount} bloqueo(s) sincronizado(s) con Google Calendar`);
          fetchBlocks(); // Recargar para mostrar los IDs actualizados
        } else {
          toast.info('ℹ️ No hay bloqueos pendientes de sincronizar');
        }
      } else {
        const errorMsg = 'error' in result ? result.error : 'Error desconocido';
        toast.error(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error syncing blocks:', error);
      toast.error('Error al sincronizar con Google Calendar');
    } finally {
      setSyncing(false);
    }
  };

  // Importar eventos externos desde Google Calendar (crear/actualizar bloques externos)
  const handleImportFromGoogleCalendar = async () => {
    if (!userId) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncGoogleCalendarEvents(userId);

      if (result.success) {
        toast.success(result.message || 'Eventos de Google Calendar importados correctamente');
        fetchBlocks();
      } else {
        toast.error(result.error || 'Error al importar eventos de Google Calendar');
      }
    } catch (error) {
      console.error('Error importing Google Calendar events:', error);
      toast.error('Error al importar eventos de Google Calendar');
    } finally {
      setSyncing(false);
    }
  };

  // Eliminar bloqueo
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloqueo?')) {
      return;
    }

    try {
      const supabase = createClient();

      // Intentar sincronizar eliminación con Google Calendar (si tiene userId)
      if (userId) {
        deleteBlockFromGoogleCalendar(blockId, userId)
          .then((result) => {
            if (result.success) {
              console.log('✅ Bloqueo eliminado de Google Calendar');
            } else {
              const errorMsg = 'error' in result ? result.error : ('message' in result ? result.message : 'Error desconocido');
              console.warn('⚠️ No se pudo eliminar de Google Calendar:', errorMsg);
            }
          })
          .catch((err) => {
            console.error('❌ Error al eliminar de Google Calendar:', err);
          });
      }

      // Eliminar de la base de datos
      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast.success('Bloqueo eliminado correctamente');

      // Emitir evento para recargar el calendario
      window.dispatchEvent(new Event('reload-calendar'));

      fetchBlocks();
      onDeleteBlock?.(blockId);
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Error al eliminar el bloqueo');
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 py-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-base text-muted-foreground">Cargando bloqueos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        {userId && (
          <>
            <Button
              variant="outline"
              onClick={handleImportFromGoogleCalendar}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Actualizando...' : 'Importar desde Google'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncWithGoogleCalendar}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Enviar bloqueos a Google'}
            </Button>
          </>
        )}
        <Button onClick={onCreateBlock}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Bloqueo
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const dayBlocks = getBlocksForDate(day.date);
              const isToday = day.isToday;
              
              return (
                <div
                  key={day.date}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg transition-colors",
                    day.isCurrentMonth 
                      ? "bg-background hover:bg-muted/50" 
                      : "bg-muted/30 text-muted-foreground",
                    isToday && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-primary"
                  )}>
                    {day.dayNumber}
                  </div>
                  
                  <div className="space-y-1">
                    {dayBlocks.slice(0, 2).map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "text-xs p-1 rounded truncate cursor-pointer",
                          "hover:opacity-80 transition-opacity",
                          (block.block_type === 'full_day' || block.block_type === 'weekly_day')
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-orange-100 text-orange-800 border border-orange-200"
                        )}
                        onClick={() => onEditBlock?.(block)}
                        title={block.title}
                      >
                        <div className="flex items-center gap-1">
                          {(block.block_type === 'full_day' || block.block_type === 'weekly_day') ? (
                            <Calendar className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span className="truncate">{block.title}</span>
                        </div>
                        {(block.block_type === 'time_range' || block.block_type === 'weekly_range') && block.start_time && block.end_time && (
                          <div className="text-xs opacity-75">
                            {block.start_time} - {block.end_time}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayBlocks.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayBlocks.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Blocks List */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Todos los Bloqueos</CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          {blocks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay bloqueos configurados</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer bloqueo para días u horarios cuando no estés disponible
              </p>
              <Button onClick={onCreateBlock}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Bloqueo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 py-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      (block.block_type === 'full_day' || block.block_type === 'weekly_day')
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                    )}>
                      {(block.block_type === 'full_day' || block.block_type === 'weekly_day') ? (
                        <Calendar className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{block.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {block.block_type === 'weekly_day' && block.day_of_week ? (
                          <span>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][block.day_of_week - 1]}
                          </span>
                        ) : (
                          <span>
                            {formatDate(block.start_date)}
                            {block.end_date && block.end_date !== block.start_date &&
                              ` - ${formatDate(block.end_date)}`}
                          </span>
                        )}
                        {(block.block_type === 'time_range' || block.block_type === 'weekly_range') && block.start_time && block.end_time && (
                          <span>{block.start_time} - {block.end_time}</span>
                        )}
                        {block.is_recurring && (
                          <Badge variant="secondary" className="text-xs">
                            Recurrente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditBlock?.(block)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBlock(block.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
