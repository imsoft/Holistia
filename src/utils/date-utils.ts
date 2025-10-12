/**
 * Utilidades para manejo de fechas sin problemas de zona horaria
 */

/**
 * Formatea una fecha de tipo DATE de la base de datos sin problemas de zona horaria
 * 
 * @param dateString - String de fecha en formato YYYY-MM-DD o ISO
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada en texto largo
 * 
 * @example
 * formatEventDate("2025-10-17") // "17 de octubre de 2025"
 */
export function formatEventDate(dateString: string, locale: string = 'es-ES'): string {
  if (!dateString) return '';
  
  // Extraer año, mes y día del string sin usar el constructor de Date
  // que aplica zona horaria
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  
  // Crear fecha local sin conversión de zona horaria
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha de tipo DATE en formato corto
 * 
 * @param dateString - String de fecha en formato YYYY-MM-DD o ISO
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada en formato corto (DD/MM/YYYY)
 * 
 * @example
 * formatEventDateShort("2025-10-17") // "17/10/2025"
 */
export function formatEventDateShort(dateString: string, locale: string = 'es-ES'): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatea una hora en formato HH:MM
 * 
 * @param timeString - String de hora en formato HH:MM:SS o HH:MM
 * @returns Hora formateada
 * 
 * @example
 * formatEventTime("14:30:00") // "14:30"
 * formatEventTime("14:30") // "14:30"
 */
export function formatEventTime(timeString: string): string {
  if (!timeString) return '';
  
  // Extraer solo HH:MM si viene con segundos
  return timeString.split(':').slice(0, 2).join(':');
}

/**
 * Obtiene una fecha local en formato YYYY-MM-DD para inputs de tipo date
 * 
 * @param date - Objeto Date o string de fecha
 * @returns String de fecha en formato YYYY-MM-DD
 * 
 * @example
 * getLocalDateString(new Date()) // "2025-10-17"
 */
export function getLocalDateString(date: Date | string = new Date()): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Verifica si una fecha de evento es pasada
 * 
 * @param dateString - String de fecha en formato YYYY-MM-DD
 * @returns true si la fecha es anterior a hoy
 */
export function isEventDatePast(dateString: string): boolean {
  if (!dateString) return false;
  
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return eventDate < today;
}

/**
 * Verifica si una fecha de evento es hoy
 * 
 * @param dateString - String de fecha en formato YYYY-MM-DD
 * @returns true si la fecha es hoy
 */
export function isEventDateToday(dateString: string): boolean {
  if (!dateString) return false;
  
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  const today = new Date();
  
  return eventDate.getFullYear() === today.getFullYear() &&
         eventDate.getMonth() === today.getMonth() &&
         eventDate.getDate() === today.getDate();
}

/**
 * Formatea fecha y hora juntos
 * 
 * @param dateString - String de fecha en formato YYYY-MM-DD
 * @param timeString - String de hora en formato HH:MM:SS o HH:MM
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha y hora formateadas
 * 
 * @example
 * formatEventDateTime("2025-10-17", "14:30") // "17 de octubre de 2025 a las 14:30"
 */
export function formatEventDateTime(
  dateString: string, 
  timeString: string,
  locale: string = 'es-ES'
): string {
  const formattedDate = formatEventDate(dateString, locale);
  const formattedTime = formatEventTime(timeString);
  
  return `${formattedDate} a las ${formattedTime}`;
}

