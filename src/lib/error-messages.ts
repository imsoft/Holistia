/**
 * Utilidades para manejar y traducir errores de Supabase a mensajes descriptivos
 */

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Obtiene un mensaje de error descriptivo basado en el código de error de Supabase
 */
export function getDescriptiveErrorMessage(error: any): string {
  // Si es un string, devolverlo directamente
  if (typeof error === 'string') {
    return error;
  }

  // Si es un Error, extraer el mensaje
  if (error instanceof Error) {
    return getErrorFromMessage(error.message);
  }

  // Si tiene estructura de error de Supabase
  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code;
  const errorMessage = supabaseError.message || '';
  const errorDetails = supabaseError.details || '';
  const errorHint = supabaseError.hint || '';

  // Mensajes basados en códigos de error comunes de PostgreSQL/Supabase
  switch (errorCode) {
    // Errores de autenticación y permisos
    case 'PGRST301':
      return 'No tienes permiso para hacer esto. Por favor, cierra sesión y vuelve a iniciar sesión, luego intenta nuevamente.';
    
    case 'PGRST116':
      return 'No encontramos lo que estás buscando. Puede que haya sido eliminado o ya no exista. Por favor, recarga la página e intenta nuevamente.';
    
    case '42501':
      return 'No tienes permiso para hacer esto. Si crees que esto es un error, contacta al administrador de Holistia.';
    
    // Errores de validación
    case '23502': // NOT NULL violation
      const fieldName = errorHint || errorDetails || '';
      if (fieldName) {
        // Intentar hacer el nombre del campo más amigable
        const friendlyField = fieldName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        return `Falta completar el campo "${friendlyField}". Por favor, completa todos los campos marcados con asterisco (*).`;
      }
      return 'Falta completar algunos campos obligatorios. Por favor, revisa el formulario y completa todos los campos marcados con asterisco (*).';
    
    case '23503': // Foreign key violation
      return 'La información que intentas vincular no existe o fue eliminada. Por favor, verifica que todo esté correcto e intenta nuevamente.';
    
    case '23505': // Unique violation
      return 'Ya existe algo con esta información. Por ejemplo, si estás creando un programa, puede que ya tengas uno con el mismo título. Por favor, usa un nombre o título diferente.';
    
    case '23514': // Check constraint violation
      return 'El valor que ingresaste no es válido. Por favor, revisa que los números sean positivos y que todos los campos tengan el formato correcto.';
    
    // Errores de formato
    case '22P02': // Invalid input syntax
      return 'El formato de la información no es correcto. Por favor, revisa que los números sean números y las fechas tengan el formato correcto.';
    
    case '22003': // Numeric value out of range
      return 'El número que ingresaste es demasiado grande o demasiado pequeño. Por favor, ingresa un número válido.';
    
    // Errores de RLS (Row Level Security)
    case 'PGRST200':
      return 'No tienes acceso a esta información. Si crees que deberías tener acceso, contacta al soporte de Holistia.';
    
    // Errores de conexión
    case 'PGRST204':
      return 'No pudimos conectarnos con nuestros servidores. Por favor, verifica tu conexión a internet e intenta nuevamente en unos momentos.';
    
    case '08006': // Connection failure
      return 'No pudimos conectarnos con nuestros servidores. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    
    // Errores de timeout
    case '57014': // Query timeout
      return 'La operación está tardando más de lo normal. Por favor, espera unos segundos e intenta nuevamente. Si el problema continúa, contacta al soporte de Holistia.';
    
    // Errores de storage
    case 'StorageApiError':
      if (errorMessage.includes('File size')) {
        return 'El archivo es demasiado grande. Por favor, reduce el tamaño del archivo e intenta nuevamente.';
      }
      if (errorMessage.includes('quota')) {
        return 'Se ha alcanzado el límite de almacenamiento. Por favor, elimina algunos archivos o contacta al soporte.';
      }
      if (errorMessage.includes('not found')) {
        return 'El archivo no se encontró. Por favor, intenta subirlo nuevamente.';
      }
      return `Error al subir el archivo: ${errorMessage || 'Por favor, verifica que el archivo sea válido e intenta nuevamente'}.`;
    
    default:
      // Si hay un mensaje descriptivo, usarlo
      if (errorMessage) {
        // Intentar extraer información útil del mensaje
        const descriptiveMessage = getErrorFromMessage(errorMessage);
        if (descriptiveMessage !== errorMessage) {
          return descriptiveMessage;
        }
      }
      
      // Mensaje genérico con información adicional
      const genericMessage = 'Ocurrió un problema al guardar tu información.';
      if (errorDetails || errorHint) {
        // Intentar hacer el mensaje más amigable
        let friendlyDetails = errorDetails || errorHint || '';
        // Remover referencias técnicas
        friendlyDetails = friendlyDetails
          .replace(/column\s+/gi, 'campo ')
          .replace(/table\s+/gi, '')
          .replace(/constraint\s+/gi, '')
          .replace(/violates\s+/gi, 'no cumple con ')
          .replace(/foreign\s+key/gi, 'referencia')
          .replace(/not\s+null/gi, 'obligatorio');
        
        return `${genericMessage} ${friendlyDetails} Si el problema continúa, contacta al soporte de Holistia.`;
      }
      
      return `${genericMessage} Por favor, revisa que toda la información esté correcta e intenta nuevamente. Si el problema continúa, contacta al soporte de Holistia.`;
  }
}

/**
 * Extrae mensajes descriptivos de strings de error comunes
 */
function getErrorFromMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Errores de autenticación
  if (lowerMessage.includes('not authenticated') || lowerMessage.includes('no autenticado')) {
    return 'Debes iniciar sesión para realizar esta acción. Por favor, inicia sesión e intenta nuevamente.';
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('no autorizado')) {
    return 'No tienes permisos para realizar esta acción. Si crees que esto es un error, contacta al soporte.';
  }
  
  // Errores de validación
  if (lowerMessage.includes('required') || lowerMessage.includes('requerido')) {
    return 'Faltan campos requeridos. Por favor, completa todos los campos obligatorios.';
  }
  
  if (lowerMessage.includes('invalid') || lowerMessage.includes('inválido')) {
    return 'El formato de los datos no es válido. Por favor, verifica que todos los campos tengan el formato correcto.';
  }
  
  // Errores de duplicados
  if (lowerMessage.includes('duplicate') || lowerMessage.includes('duplicado') || lowerMessage.includes('already exists')) {
    return 'Ya existe un registro con esta información. Por favor, usa valores diferentes.';
  }
  
  // Errores de archivos
  if (lowerMessage.includes('file size') || lowerMessage.includes('tamaño')) {
    return 'El archivo es demasiado grande. Por favor, reduce el tamaño del archivo.';
  }
  
  if (lowerMessage.includes('file type') || lowerMessage.includes('tipo de archivo')) {
    return 'El tipo de archivo no es válido. Por favor, usa un formato compatible.';
  }
  
  // Errores de conexión
  if (lowerMessage.includes('network') || lowerMessage.includes('conexión') || lowerMessage.includes('connection')) {
    return 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.';
  }
  
  // Errores de permisos
  if (lowerMessage.includes('permission') || lowerMessage.includes('permiso') || lowerMessage.includes('forbidden')) {
    return 'No tienes permisos para realizar esta acción. Si crees que esto es un error, contacta al soporte de Holistia.';
  }
  
  // Errores de RLS
  if (lowerMessage.includes('row level security') || lowerMessage.includes('rls')) {
    return 'No tienes permiso para acceder a esta información. Si crees que esto es un error, contacta al soporte de Holistia.';
  }
  
  // Si no se encuentra un patrón conocido, devolver el mensaje original
  return message;
}

/**
 * Determina si un error es del sistema (Holistia) o del usuario
 */
export function isSystemError(error: any): boolean {
  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code;
  const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
  
  // Errores que son claramente del sistema
  const systemErrorCodes = ['PGRST204', '08006', '57014', 'PGRST200'];
  if (systemErrorCodes.includes(errorCode || '')) {
    return true;
  }
  
  // Errores de conexión, timeout, servidor
  if (
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('server error') ||
    errorMessage.includes('internal error') ||
    errorMessage.includes('network')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Mensajes amigables para flujos de reserva y pago de citas.
 * Usar en PaymentButton, modales de reserva y página de confirmación.
 */
export const BOOKING_MESSAGES = {
  /** Error genérico al no poder reservar (horario, disponibilidad, etc.) */
  RESERVE_FAILED:
    "No se pudo reservar. Intenta de nuevo o elige otro horario.",
  /** Error al no completar el pago (tarjeta, Stripe, etc.) */
  PAYMENT_FAILED:
    "No se pudo completar el pago. Revisa tus datos o intenta con otra tarjeta.",
  /** Usuario canceló el pago en Stripe Checkout */
  PAYMENT_CANCELLED:
    "Reserva cancelada. Puedes elegir otro horario cuando quieras.",
  /** Pago/reserva en proceso (evitar sensación de estado a medias) */
  PAYMENT_PROCESSING:
    "Estamos confirmando tu pago. En unos segundos tu cita quedará confirmada. Recibirás un email con el ticket.",
  /** Cita no encontrada justo después del pago (procesando) */
  APPOINTMENT_PROCESSING:
    "Estamos procesando tu reserva. Revisa Mis citas en unos segundos.",
} as const;

/**
 * Devuelve un mensaje amigable para errores de reserva/pago.
 * Úsalo en onError de PaymentButton y en modales de error de reserva.
 */
export function getBookingErrorMessage(error: string): string {
  const lower = error.toLowerCase();
  if (
    lower.includes("configurado su cuenta") ||
    lower.includes("stripe_not_configured")
  )
    return "El profesional aún no ha configurado su cuenta para recibir pagos. Contacta al profesional o intenta con otro experto.";
  if (
    lower.includes("configuración") ||
    lower.includes("stripe_incomplete")
  )
    return "La cuenta de pagos del profesional está en proceso de configuración. Intenta más tarde o contacta al profesional.";
  if (lower.includes("ya tiene un pago confirmado"))
    return "Esta cita ya tiene un pago confirmado. No es necesario pagar nuevamente.";
  if (lower.includes("cita reservada en este horario") || lower.includes("horario"))
    return "Ya tienes una cita reservada en este horario. Elige otro horario disponible.";
  if (lower.includes("crear registro de pago") || lower.includes("sesión de pago"))
    return BOOKING_MESSAGES.PAYMENT_FAILED;
  return BOOKING_MESSAGES.RESERVE_FAILED;
}

/**
 * Obtiene un mensaje completo con contexto adicional
 */
export function getFullErrorMessage(error: any, context?: string): string {
  const baseMessage = getDescriptiveErrorMessage(error);
  const isSystem = isSystemError(error);
  
  let fullMessage = baseMessage;
  
  if (context) {
    fullMessage = `${context}: ${baseMessage}`;
  }
  
  if (isSystem) {
    fullMessage += ' Este es un problema técnico de Holistia, no es tu culpa. Por favor, contacta al soporte de Holistia y ellos te ayudarán a resolverlo.';
  }
  
  return fullMessage;
}
