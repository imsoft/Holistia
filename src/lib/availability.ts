/**
 * Lógica compartida de disponibilidad para validación de bloques, working days/hours.
 *
 * IMPORTANTE: Esta es la ÚNICA fuente de verdad para determinar si un slot está
 * disponible o bloqueado. Cualquier cambio debe hacerse aquí, y todos los consumidores
 * (hook, checkout, create-appointment-dialog, reschedule) usarán estas mismas funciones.
 *
 * Se usa tanto en client-side (hooks) como en server-side (API routes).
 */

import { parseLocalDate } from './date-utils';

// ---------------------------------------------------------------------------
// Tipos mínimos para los datos de bloque (compatible con AvailabilityBlock)
// ---------------------------------------------------------------------------

export interface BlockData {
  block_type: string;
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  day_of_week?: number | null;
  is_recurring?: boolean;
}

export interface WorkingHoursData {
  working_start_time: string;
  working_end_time: string;
  working_days: number[];
}

// ---------------------------------------------------------------------------
// Helpers de día de la semana
// ---------------------------------------------------------------------------

/** Convierte JS getDay() (0=Dom) a nuestro sistema (1=Lun ... 7=Dom) */
export function normalizeDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/** Obtiene día de la semana (1-7) de una fecha YYYY-MM-DD */
export function getDayOfWeekFromDate(dateString: string): number {
  const date = parseLocalDate(dateString);
  return normalizeDayOfWeek(date.getDay());
}

/** Verifica si un día está en un rango semanal (soporta wrap-around, ej. Vie-Mar = 5-2) */
export function isDayOfWeekInRange(day: number, start: number, end: number): boolean {
  if (start <= end) return day >= start && day <= end;
  return day >= start || day <= end;
}

// ---------------------------------------------------------------------------
// Validación de bloques
// ---------------------------------------------------------------------------

/**
 * Determina si un bloque aplica a una fecha específica.
 * Esta función implementa las reglas para los 4 tipos de bloque:
 * - weekly_day: día completo, recurrente o de una sola vez
 * - weekly_range: rango de horas, recurrente o de una sola vez
 * - full_day: día completo legacy, recurrente basado en patrón semanal
 * - time_range: rango de horas legacy/Google Calendar
 */
export function doesBlockApplyToDate(date: string, block: BlockData): boolean {
  const currentDate = parseLocalDate(date);
  currentDate.setHours(0, 0, 0, 0);
  const dayOfWeek = normalizeDayOfWeek(currentDate.getDay());

  const blockStartDate = parseLocalDate(block.start_date);
  const blockEndDate = block.end_date ? parseLocalDate(block.end_date) : new Date(blockStartDate.getTime());
  blockStartDate.setHours(0, 0, 0, 0);
  blockEndDate.setHours(0, 0, 0, 0);

  const isInDateRange = currentDate >= blockStartDate && currentDate <= blockEndDate;
  const dayOfWeekStart = normalizeDayOfWeek(blockStartDate.getDay());
  const dayOfWeekEnd = normalizeDayOfWeek(blockEndDate.getDay());

  switch (block.block_type) {
    case 'weekly_day': {
      const matchesDayOfWeek = block.day_of_week === dayOfWeek;
      if (block.is_recurring) {
        // Recurrente: aplica a TODAS las ocurrencias del día de la semana
        return matchesDayOfWeek;
      }
      // No recurrente: solo aplica a la fecha exacta en start_date
      return matchesDayOfWeek && block.start_date === date;
    }

    case 'weekly_range': {
      let isInWeekRange: boolean;
      if (block.day_of_week != null) {
        // Si el bloque tiene day_of_week explícito, usarlo directamente
        isInWeekRange = dayOfWeek === block.day_of_week;
      } else {
        // Derivar el rango de días de la semana desde start_date/end_date
        isInWeekRange = isDayOfWeekInRange(dayOfWeek, dayOfWeekStart, dayOfWeekEnd);
      }
      if (block.is_recurring) {
        // Recurrente: aplica a TODAS las ocurrencias dentro del rango de días
        return isInWeekRange;
      }
      // No recurrente: solo aplica dentro del rango de fechas específicas
      return isInWeekRange && isInDateRange;
    }

    case 'full_day': {
      // Legacy: si es recurrente, interpretar como patrón semanal
      if (block.is_recurring) {
        return isDayOfWeekInRange(dayOfWeek, dayOfWeekStart, dayOfWeekEnd);
      }
      return isInDateRange;
    }

    case 'time_range': {
      // Legacy / Google Calendar
      // IMPORTANTE: Los bloqueos de Google Calendar son siempre no recurrentes
      if (block.is_recurring) {
        return isDayOfWeekInRange(dayOfWeek, dayOfWeekStart, dayOfWeekEnd);
      }
      return isInDateRange;
    }

    default:
      return false;
  }
}

/**
 * Dado un bloque que aplica a una fecha, determina si cubre un horario específico.
 */
export function doesBlockCoverTime(time: string, block: BlockData): boolean {
  // Bloqueo de día completo (sin start_time/end_time)
  if (
    (block.block_type === 'full_day' || block.block_type === 'weekly_day') &&
    !block.start_time && !block.end_time
  ) {
    return true; // Bloquea todo el día
  }

  // Bloqueo con rango de horas
  if (block.start_time && block.end_time) {
    const blockStart = block.start_time.substring(0, 5);
    const blockEnd = block.end_time.substring(0, 5);
    const timeNorm = time.substring(0, 5);
    return timeNorm >= blockStart && timeNorm < blockEnd;
  }

  return false;
}

/**
 * Verifica si un slot específico (fecha + hora) está bloqueado por un bloque dado.
 */
export function isSlotBlockedByBlock(date: string, time: string, block: BlockData): boolean {
  if (!doesBlockApplyToDate(date, block)) return false;
  return doesBlockCoverTime(time, block);
}

/**
 * Verifica si un slot (fecha + hora) está bloqueado por ALGÚN bloque de la lista.
 */
export function isSlotBlocked(date: string, time: string, blocks: BlockData[]): boolean {
  return blocks.some(block => isSlotBlockedByBlock(date, time, block));
}

/**
 * Verifica si una fecha tiene un bloqueo de día completo.
 */
export function isFullDayBlocked(date: string, blocks: BlockData[]): boolean {
  return blocks.some(block => {
    if (!doesBlockApplyToDate(date, block)) return false;
    return (block.block_type === 'full_day' || block.block_type === 'weekly_day') &&
      !block.start_time && !block.end_time;
  });
}

// ---------------------------------------------------------------------------
// Validación de working days / hours
// ---------------------------------------------------------------------------

/** Verifica si una fecha cae en un día laboral del profesional */
export function isWorkingDay(date: string, workingDays: number[]): boolean {
  const dayOfWeek = getDayOfWeekFromDate(date);
  return workingDays.includes(dayOfWeek);
}

/** Verifica si una hora está dentro del horario laboral */
export function isWithinWorkingHours(time: string, startTime: string, endTime: string): boolean {
  const timeNorm = time.substring(0, 5);
  const start = startTime.substring(0, 5);
  const end = endTime.substring(0, 5);
  return timeNorm >= start && timeNorm < end;
}

// ---------------------------------------------------------------------------
// Filtrado de bloques por rango de fechas (para pre-filtrar antes de evaluar)
// ---------------------------------------------------------------------------

/**
 * Filtra bloques que podrían aplicar a un rango de fechas.
 * Los bloques recurrentes siempre se incluyen.
 * Los no recurrentes se incluyen solo si su rango se superpone con el rango dado.
 */
export function filterBlocksForDateRange(
  blocks: BlockData[],
  startDate: string,
  endDate: string
): BlockData[] {
  const rangeStart = parseLocalDate(startDate);
  const rangeEnd = parseLocalDate(endDate);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(0, 0, 0, 0);

  return blocks.filter(block => {
    // Los bloques recurrentes siempre se incluyen porque aplican por patrón semanal
    if (block.is_recurring) return true;

    // Para no recurrentes, verificar superposición de fechas
    const blockStart = parseLocalDate(block.start_date);
    const blockEnd = block.end_date ? parseLocalDate(block.end_date) : new Date(blockStart.getTime());
    blockStart.setHours(0, 0, 0, 0);
    blockEnd.setHours(0, 0, 0, 0);

    return blockStart <= rangeEnd && blockEnd >= rangeStart;
  });
}

// ---------------------------------------------------------------------------
// Función combinada para validación completa de un slot
// ---------------------------------------------------------------------------

export type SlotStatus = 'available' | 'not_working_day' | 'outside_hours' | 'occupied' | 'blocked';

/**
 * Determina el estado de un slot dado todos los factores:
 * - Día laboral
 * - Horario laboral
 * - Citas existentes
 * - Bloques de disponibilidad
 */
export function getSlotStatus(
  date: string,
  time: string,
  workingHours: WorkingHoursData,
  blocks: BlockData[],
  occupiedTimes: Set<string>
): SlotStatus {
  const dayOfWeek = getDayOfWeekFromDate(date);

  if (!workingHours.working_days.includes(dayOfWeek)) {
    return 'not_working_day';
  }

  const timeNorm = time.substring(0, 5);
  const start = workingHours.working_start_time.substring(0, 5);
  const end = workingHours.working_end_time.substring(0, 5);
  if (timeNorm < start || timeNorm >= end) {
    return 'outside_hours';
  }

  // Verificar día completo bloqueado primero (optimización)
  if (isFullDayBlocked(date, blocks)) {
    return 'blocked';
  }

  if (occupiedTimes.has(timeNorm)) {
    return 'occupied';
  }

  if (isSlotBlocked(date, time, blocks)) {
    return 'blocked';
  }

  return 'available';
}

// ---------------------------------------------------------------------------
// Timezone helpers para server-side (cron, mark-no-show, Google Calendar)
// ---------------------------------------------------------------------------

/**
 * Timezone por defecto de la plataforma.
 * Las citas se almacenan como "wall clock" (hora local) sin zona horaria.
 * Este timezone se usa para interpretar esas horas en el servidor (UTC).
 */
export const PLATFORM_TIMEZONE = 'America/Mexico_City';

/**
 * Convierte una fecha+hora "wall clock" (sin timezone) a timestamp UTC.
 * Necesario en el servidor (que corre en UTC) para comparar con Date.now().
 *
 * Ejemplo: wallClockToUtcMs('2025-02-10', '10:00') con timezone 'America/Mexico_City'
 * → retorna el timestamp UTC de las 10:00 AM en México (= 16:00 UTC)
 */
export function wallClockToUtcMs(
  dateStr: string,
  timeStr: string,
  timezone = PLATFORM_TIMEZONE
): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const timeParts = timeStr.split(':').map(Number);
  const h = timeParts[0] || 0;
  const min = timeParts[1] || 0;

  // Paso 1: Crear timestamp UTC con los valores del wall-clock
  const utcGuess = Date.UTC(y, m - 1, d, h, min, 0);

  // Paso 2: Averiguar qué hora muestra ese UTC en la timezone objetivo
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcGuess));

  const tzY = parseInt(parts.find(p => p.type === 'year')!.value);
  const tzM = parseInt(parts.find(p => p.type === 'month')!.value);
  const tzD = parseInt(parts.find(p => p.type === 'day')!.value);
  let tzH = parseInt(parts.find(p => p.type === 'hour')!.value);
  const tzMin = parseInt(parts.find(p => p.type === 'minute')!.value);
  if (tzH === 24) tzH = 0;

  // Paso 3: Calcular el offset UTC → timezone
  const tzMs = Date.UTC(tzY, tzM - 1, tzD, tzH, tzMin, 0);
  const offsetMs = utcGuess - tzMs;

  // Paso 4: El UTC real = wall-clock-como-UTC + offset
  return utcGuess + offsetMs;
}

/**
 * Formatea fecha+hora para la API de Google Calendar.
 * Devuelve un dateTime SIN indicador de zona (Google lo interpreta con el timeZone adjunto).
 * Esto evita la conversión incorrecta de toISOString() que produce UTC.
 */
export function formatForGoogleCalendar(
  dateStr: string,
  timeStr: string,
  durationMinutes: number
): { startDateTime: string; endDateTime: string } {
  const timeNorm = timeStr.substring(0, 5);
  const startDateTime = `${dateStr}T${timeNorm}:00`;

  const [h, m] = timeNorm.split(':').map(Number);
  const endTotalMin = h * 60 + m + durationMinutes;
  const endH = Math.floor(endTotalMin / 60);
  const endM = endTotalMin % 60;

  let endDateStr = dateStr;
  if (endH >= 24) {
    // Manejar overflow de día
    const [y, mo, d] = dateStr.split('-').map(Number);
    const nextDay = new Date(y, mo - 1, d + Math.floor(endH / 24));
    endDateStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
  }

  const endDateTime = `${endDateStr}T${String(endH % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

  return { startDateTime, endDateTime };
}
