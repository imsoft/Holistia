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
      return 'No tienes permisos para realizar esta acción. Por favor, verifica que estés autenticado correctamente.';
    
    case 'PGRST116':
      return 'No se encontró el registro solicitado. Puede que haya sido eliminado o no exista.';
    
    case '42501':
      return 'No tienes permisos para realizar esta operación. Contacta al administrador si crees que esto es un error.';
    
    // Errores de validación
    case '23502': // NOT NULL violation
      return `Falta información requerida: ${errorHint || errorDetails || 'Algún campo obligatorio está vacío'}. Por favor, completa todos los campos marcados como requeridos.`;
    
    case '23503': // Foreign key violation
      return `Error de referencia: ${errorDetails || 'El registro que intentas vincular no existe'}. Por favor, verifica la información relacionada.`;
    
    case '23505': // Unique violation
      return `Ya existe un registro con esta información: ${errorDetails || 'El valor que intentas usar ya está en uso'}. Por favor, usa un valor diferente.`;
    
    case '23514': // Check constraint violation
      return `El valor ingresado no es válido: ${errorDetails || errorHint || 'Por favor, verifica que los valores cumplan con los requisitos'}.`;
    
    // Errores de formato
    case '22P02': // Invalid input syntax
      return `Formato inválido: ${errorDetails || 'El formato de los datos no es correcto'}. Por favor, verifica que los valores tengan el formato adecuado.`;
    
    case '22003': // Numeric value out of range
      return `Valor numérico fuera de rango: ${errorDetails || 'El número ingresado es demasiado grande o pequeño'}. Por favor, ingresa un valor válido.`;
    
    // Errores de RLS (Row Level Security)
    case 'PGRST200':
      return `Error de permisos: ${errorDetails || 'No tienes acceso a este recurso'}. Si crees que esto es un error, contacta al soporte de Holistia.`;
    
    // Errores de conexión
    case 'PGRST204':
      return 'Error de conexión con la base de datos. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    
    case '08006': // Connection failure
      return 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    
    // Errores de timeout
    case '57014': // Query timeout
      return 'La operación tardó demasiado tiempo. Por favor, intenta nuevamente. Si el problema persiste, contacta al soporte de Holistia.';
    
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
      const genericMessage = 'Ocurrió un error al procesar tu solicitud.';
      if (errorDetails || errorHint) {
        return `${genericMessage} ${errorDetails || errorHint} Si el problema persiste, contacta al soporte de Holistia.`;
      }
      
      return `${genericMessage} Si el problema persiste, contacta al soporte de Holistia.`;
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
    return 'Error de permisos en la base de datos. Si crees que esto es un error, contacta al soporte de Holistia.';
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
    fullMessage += ' Este es un problema del sistema. Por favor, contacta al soporte de Holistia si el problema persiste.';
  }
  
  return fullMessage;
}
