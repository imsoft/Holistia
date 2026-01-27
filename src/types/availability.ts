/**
 * Tipos de bloques de disponibilidad para profesionales
 *
 * ## Guía de uso de tipos de bloque:
 *
 * ### 1. `full_day` - Bloqueo de día completo
 * Bloquea todo el día sin especificar horarios.
 * - Campos requeridos: start_date
 * - Campos opcionales: end_date (para rangos de días), is_recurring
 * - Ejemplo: Vacaciones del 25 al 31 de diciembre
 *   { block_type: 'full_day', start_date: '2025-12-25', end_date: '2025-12-31' }
 *
 * ### 2. `time_range` - Bloqueo de rango de horas (RECOMENDADO para Google Calendar)
 * Bloquea un rango específico de horas en una fecha o rango de fechas.
 * - Campos requeridos: start_date, start_time, end_time
 * - Campos opcionales: end_date, is_recurring
 * - Usado por: Sincronización de Google Calendar, bloqueos manuales de horas
 * - Ejemplo: Reunión el lunes de 14:00 a 16:00
 *   { block_type: 'time_range', start_date: '2025-01-27', start_time: '14:00', end_time: '16:00' }
 *
 * ### 3. `weekly_day` - Bloqueo semanal de día completo
 * Bloquea un día específico de la semana de forma recurrente.
 * - Campos requeridos: day_of_week (1=Lunes, 7=Domingo), is_recurring=true
 * - Ejemplo: No trabajo los domingos
 *   { block_type: 'weekly_day', day_of_week: 7, is_recurring: true }
 *
 * ### 4. `weekly_range` - Bloqueo semanal de rango de horas
 * Bloquea un rango de horas en días específicos de forma recurrente.
 * - Campos requeridos: start_time, end_time, is_recurring=true
 * - Usa start_date/end_date para definir el rango de días de la semana
 * - Ejemplo: No atiendo después de las 17:00 los viernes
 *   { block_type: 'weekly_range', start_time: '17:00', end_time: '23:59', start_date: '2025-01-24', is_recurring: true }
 *
 * ## Notas importantes:
 * - Los eventos de Google Calendar SIEMPRE usan `time_range` con `is_external_event: true`
 * - Los bloques recurrentes (`is_recurring: true`) se aplican TODAS las semanas
 * - Los bloques no recurrentes solo aplican en las fechas especificadas
 */

export interface AvailabilityBlock {
  id?: string;
  professional_id: string;
  user_id: string;
  title: string;
  description?: string | null;

  /**
   * Tipo de bloqueo:
   * - 'full_day': Bloquea todo el día
   * - 'time_range': Bloquea un rango de horas específico
   * - 'weekly_day': Bloquea un día de la semana (recurrente)
   * - 'weekly_range': Bloquea un rango de horas semanal (recurrente)
   */
  block_type: 'full_day' | 'time_range' | 'weekly_day' | 'weekly_range';

  /** Fecha de inicio en formato YYYY-MM-DD */
  start_date: string;

  /** Fecha de fin en formato YYYY-MM-DD (para rangos de varios días) */
  end_date?: string | null;

  /** Hora de inicio en formato HH:MM (para time_range y weekly_range) */
  start_time?: string | null;

  /** Hora de fin en formato HH:MM (para time_range y weekly_range) */
  end_time?: string | null;

  /**
   * Día de la semana para bloqueos semanales
   * 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo
   */
  day_of_week?: number | null;

  /** Si es true, el bloqueo se repite semanalmente */
  is_recurring: boolean;

  /** Si es true, el bloqueo viene de una fuente externa (ej: Google Calendar) */
  is_external_event?: boolean;

  /** Fuente del evento externo (ej: 'google_calendar') */
  external_event_source?: string | null;

  /** ID del evento en Google Calendar (para sincronización bidireccional) */
  google_calendar_event_id?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface AvailabilityBlockFormData {
  title: string;
  description?: string;
  block_type: 'full_day' | 'time_range' | 'weekly_day' | 'weekly_range';
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  day_of_week?: number;
  is_recurring: boolean;
}

export interface BlockedTimeSlot {
  date: string;
  start_time?: string;
  end_time?: string;
  title: string;
  description?: string;
  is_full_day: boolean;
}

/**
 * Resultado de validación de un bloque
 */
export interface BlockValidationResult {
  isValid: boolean;
  errors: string[];
  overlappingBlocks: AvailabilityBlock[];
}
