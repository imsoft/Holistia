'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import type { AvailabilityBlock } from '@/types/availability';

interface BlocksCalendarViewProps {
  professionalId: string;
  onEditBlock?: (block: AvailabilityBlock) => void;
  onDeleteBlock?: (blockId: string) => void;
  onCreateBlock?: () => void;
}

export function BlocksCalendarView({ 
  professionalId, 
  onEditBlock, 
  onDeleteBlock,
  onCreateBlock 
}: BlocksCalendarViewProps) {
  const supabase = createClient();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Cargar bloqueos
  const fetchBlocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      console.log('🔍 Blocks fetched:', data);
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Error al cargar los bloqueos');
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  useEffect(() => {
    fetchBlocks();
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
        date: date.toISOString().split('T')[0],
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
        date: date.toISOString().split('T')[0],
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
        date: date.toISOString().split('T')[0],
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
    const currentDate = new Date(date);
    const dayOfWeekCurrent = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
    
    return blocks.filter(block => {
      if (block.block_type === 'full_day') {
        return block.start_date <= date && (!block.end_date || block.end_date >= date);
      } else if (block.block_type === 'time_range') {
        return block.start_date <= date && (!block.end_date || block.end_date >= date);
      } else if (block.block_type === 'weekly_day') {
        // Bloqueo semanal de día completo
        const applies = block.day_of_week === dayOfWeekCurrent && block.start_date <= date;
        if (date.startsWith('2025-11-')) {
          console.log('📅 Checking weekly_day block:', {
            date,
            dayOfWeekCurrent,
            blockDayOfWeek: block.day_of_week,
            blockStartDate: block.start_date,
            applies,
            blockTitle: block.title
          });
        }
        return applies;
      } else if (block.block_type === 'weekly_range') {
        // Bloqueo semanal de rango de horas
        const blockStartDate = new Date(block.start_date);
        const blockEndDate = block.end_date ? new Date(block.end_date) : null;
        const dayOfWeekStart = blockStartDate.getDay() === 0 ? 7 : blockStartDate.getDay();
        const dayOfWeekEnd = blockEndDate ? (blockEndDate.getDay() === 0 ? 7 : blockEndDate.getDay()) : dayOfWeekStart;
        
        // Verificar si el día actual está en el rango de días de la semana
        const isInWeekRange = dayOfWeekCurrent >= dayOfWeekStart && dayOfWeekCurrent <= dayOfWeekEnd;
        return isInWeekRange && block.start_date <= date;
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

  // Eliminar bloqueo
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloqueo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      
      toast.success('Bloqueo eliminado correctamente');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bloqueos de Disponibilidad</h2>
          <p className="text-muted-foreground">
            Gestiona tus días y horarios no disponibles
          </p>
        </div>
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
                      block.block_type === 'full_day'
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                    )}>
                      {block.block_type === 'full_day' ? (
                        <Calendar className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{block.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {formatDate(block.start_date)}
                          {block.end_date && block.end_date !== block.start_date && 
                            ` - ${formatDate(block.end_date)}`}
                        </span>
                        {block.block_type === 'time_range' && block.start_time && block.end_time && (
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
