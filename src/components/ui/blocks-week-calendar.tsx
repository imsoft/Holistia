'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatLocalDate } from '@/lib/date-utils';
import { doesBlockApplyToDate, doesBlockCoverTime, isFullDayBlocked } from '@/lib/availability';
import type { AvailabilityBlock } from '@/types/availability';

interface BlocksWeekCalendarProps {
  blocks: AvailabilityBlock[];
  workingStartTime: string;
  workingEndTime: string;
  workingDays: number[];
  onClickBlock?: (block: AvailabilityBlock) => void;
}

export function BlocksWeekCalendar({
  blocks,
  workingStartTime,
  workingEndTime,
  workingDays,
  onClickBlock,
}: BlocksWeekCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calcular inicio de semana (lunes)
  const weekStart = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=dom, 1=lun, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  // Generar 7 días de la semana
  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      const dateStr = formatLocalDate(date);
      days.push({
        date,
        dateStr,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [weekStart]);

  // Generar horas de trabajo
  const hours = useMemo(() => {
    const startHour = parseInt(workingStartTime.split(':')[0], 10);
    const endHour = parseInt(workingEndTime.split(':')[0], 10);
    const result: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return result;
  }, [workingStartTime, workingEndTime]);

  // Para cada celda: encontrar bloques que aplican
  const getBlocksForCell = useCallback((dateStr: string, time: string): AvailabilityBlock[] => {
    return blocks.filter(block => {
      if (!doesBlockApplyToDate(dateStr, block)) return false;
      // Full day blocks
      if (block.block_type === 'full_day' || block.block_type === 'weekly_day') return true;
      // Time range blocks
      return doesBlockCoverTime(time, block);
    });
  }, [blocks]);

  // Verificar si un día es laboral (1=Lun...7=Dom)
  const isWorkingDay = useCallback((dayIndex: number) => {
    // dayIndex 0=Lun(1), 1=Mar(2), ... 6=Dom(7)
    const isoDay = dayIndex + 1;
    return workingDays.includes(isoDay);
  }, [workingDays]);

  // Formato de la semana para el header
  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (start.date.getMonth() === end.date.getMonth()) {
      return `${start.dayNumber} – ${end.dayNumber} ${months[start.date.getMonth()]} ${start.date.getFullYear()}`;
    }
    return `${start.dayNumber} ${months[start.date.getMonth()]} – ${end.dayNumber} ${months[end.date.getMonth()]} ${end.date.getFullYear()}`;
  }, [weekDays]);

  return (
    <div className="space-y-3">
      {/* Navegación semanal */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{weekLabel}</span>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="xs" onClick={() => setWeekOffset(0)}>
              Hoy
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
          <span>Día completo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300" />
          <span>Rango de horas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
          <span>Google Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted border" />
          <span>No laboral</span>
        </div>
      </div>

      {/* Grid semanal */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header de días */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border rounded-t-lg overflow-hidden">
            <div className="bg-muted p-2 text-xs font-medium text-muted-foreground text-center">Hora</div>
            {weekDays.map((day, i) => (
              <div
                key={day.dateStr}
                className={cn(
                  'p-2 text-center text-xs font-medium',
                  day.isToday ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  !isWorkingDay(i) && 'opacity-50'
                )}
              >
                <div>{day.dayName}</div>
                <div className={cn('text-lg font-bold', day.isToday && 'text-primary')}>
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Filas de horas */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border rounded-b-lg overflow-hidden">
            {hours.map(hour => (
              <div key={hour} className="contents">
                {/* Hora label */}
                <div className="bg-background p-2 text-xs text-muted-foreground text-right pr-3 flex items-center justify-end">
                  {hour}
                </div>

                {/* Celdas por día */}
                {weekDays.map((day, dayIndex) => {
                  const notWorking = !isWorkingDay(dayIndex);
                  const cellBlocks = getBlocksForCell(day.dateStr, hour);
                  const hasFullDay = cellBlocks.some(b => b.block_type === 'full_day' || b.block_type === 'weekly_day');
                  const hasTimeRange = cellBlocks.some(b => b.block_type === 'time_range' || b.block_type === 'weekly_range');
                  const hasExternal = cellBlocks.some(b => b.is_external_event);
                  const firstBlock = cellBlocks[0];

                  let cellClass = 'bg-background';
                  if (notWorking) {
                    cellClass = 'bg-muted/60';
                  } else if (hasExternal) {
                    cellClass = 'bg-blue-100 dark:bg-blue-950/40 hover:bg-blue-200 dark:hover:bg-blue-950/60 cursor-pointer';
                  } else if (hasFullDay) {
                    cellClass = 'bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-950/60 cursor-pointer';
                  } else if (hasTimeRange) {
                    cellClass = 'bg-orange-100 dark:bg-orange-950/40 hover:bg-orange-200 dark:hover:bg-orange-950/60 cursor-pointer';
                  }

                  return (
                    <div
                      key={`${day.dateStr}-${hour}`}
                      className={cn(
                        'min-h-[40px] p-1 text-xs transition-colors relative',
                        cellClass
                      )}
                      onClick={() => {
                        if (firstBlock && onClickBlock) {
                          onClickBlock(firstBlock);
                        }
                      }}
                    >
                      {firstBlock && !notWorking && (
                        <div className="truncate leading-tight">
                          <span className="font-medium text-[10px] leading-none">
                            {firstBlock.title}
                          </span>
                          {hasExternal && (
                            <ExternalLink className="inline w-2.5 h-2.5 ml-0.5 opacity-60" />
                          )}
                          {cellBlocks.length > 1 && (
                            <span className="text-[10px] text-muted-foreground ml-0.5">
                              +{cellBlocks.length - 1}
                            </span>
                          )}
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
    </div>
  );
}
