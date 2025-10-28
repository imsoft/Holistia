/**
 * Utilidades para el manejo de fechas que evitan problemas de zona horaria
 */

/**
 * Formatea una fecha en formato YYYY-MM-DD evitando problemas de zona horaria
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @param locale - Locale para el formato (por defecto 'es-MX')
 * @param options - Opciones adicionales para toLocaleDateString
 * @returns Fecha formateada
 */
export function formatDate(
  dateString: string, 
  locale: string = 'es-MX', 
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  // Crear la fecha usando componentes individuales para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month es 0-indexado
  
  return date.toLocaleDateString(locale, options);
}

/**
 * Formatea una fecha con hora completa (timestamp)
 * @param dateString - Fecha/hora en formato ISO o similar
 * @param locale - Locale para el formato (por defecto 'es-MX')
 * @param options - Opciones adicionales para toLocaleDateString
 * @returns Fecha formateada
 */
export function formatDateTime(
  dateString: string, 
  locale: string = 'es-MX', 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  return new Date(dateString).toLocaleDateString(locale, options);
}

/**
 * Verifica si una cadena de fecha es solo una fecha (YYYY-MM-DD) o incluye hora
 * @param dateString - Cadena de fecha a verificar
 * @returns true si es solo fecha, false si incluye hora
 */
export function isDateOnly(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

/**
 * Formatea una fecha de manera inteligente, detectando si es solo fecha o incluye hora
 * @param dateString - Fecha a formatear
 * @param locale - Locale para el formato (por defecto 'es-MX')
 * @param options - Opciones adicionales para toLocaleDateString
 * @returns Fecha formateada
 */
export function formatDateSmart(
  dateString: string, 
  locale: string = 'es-MX', 
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  if (isDateOnly(dateString)) {
    return formatDate(dateString, locale, options);
  } else {
    return formatDateTime(dateString, locale, options);
  }
}
