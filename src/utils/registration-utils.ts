/**
 * Utilidades para el manejo del pago de inscripción anual de profesionales
 */

/**
 * Verifica si el pago de inscripción está vigente (pagado y no expirado)
 */
export function isRegistrationFeeActive(
  paid: boolean | undefined,
  expiresAt: string | undefined | null
): boolean {
  if (!paid || !expiresAt) {
    return false;
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();

  return expirationDate > now;
}

/**
 * Calcula los días restantes hasta que expire el pago de inscripción
 * Retorna null si no hay fecha de expiración
 * Retorna número negativo si ya expiró
 */
export function daysUntilExpiration(expiresAt: string | undefined | null): number | null {
  if (!expiresAt) {
    return null;
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Verifica si el pago está próximo a vencer (menos de 30 días)
 */
export function isExpirationNear(expiresAt: string | undefined | null): boolean {
  const days = daysUntilExpiration(expiresAt);
  
  if (days === null) {
    return false;
  }

  return days > 0 && days <= 30;
}

/**
 * Verifica si el pago ya expiró
 */
export function isExpired(expiresAt: string | undefined | null): boolean {
  const days = daysUntilExpiration(expiresAt);
  
  if (days === null) {
    return false;
  }

  return days < 0;
}

/**
 * Formatea la fecha de expiración para mostrar al usuario
 */
export function formatExpirationDate(expiresAt: string | undefined | null): string {
  if (!expiresAt) {
    return 'No disponible';
  }

  const date = new Date(expiresAt);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Obtiene el estado del pago con información detallada
 */
export function getRegistrationFeeStatus(
  paid: boolean | undefined,
  expiresAt: string | undefined | null
): {
  isActive: boolean;
  isExpired: boolean;
  isNearExpiration: boolean;
  daysRemaining: number | null;
  message: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  if (!paid) {
    return {
      isActive: false,
      isExpired: false,
      isNearExpiration: false,
      daysRemaining: null,
      message: 'Pago pendiente',
      color: 'gray'
    };
  }

  const days = daysUntilExpiration(expiresAt);
  const expired = isExpired(expiresAt);
  const nearExpiration = isExpirationNear(expiresAt);

  if (expired) {
    return {
      isActive: false,
      isExpired: true,
      isNearExpiration: false,
      daysRemaining: days,
      message: 'Pago expirado - Requiere renovación',
      color: 'red'
    };
  }

  if (nearExpiration) {
    return {
      isActive: true,
      isExpired: false,
      isNearExpiration: true,
      daysRemaining: days,
      message: `Expira en ${days} día${days !== 1 ? 's' : ''}`,
      color: 'yellow'
    };
  }

  return {
    isActive: true,
    isExpired: false,
    isNearExpiration: false,
    daysRemaining: days,
    message: 'Pago vigente',
    color: 'green'
  };
}

