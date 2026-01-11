/**
 * Utilidades para manejo de cookies en el navegador
 * 
 * Este módulo proporciona funciones helper para trabajar con cookies
 * de forma consistente en toda la aplicación.
 * 
 * IMPORTANTE: Estas funciones solo funcionan en el cliente (navegador).
 * Para cookies del servidor, usar las funciones de Next.js (cookies() de 'next/headers').
 */

export interface CookieOptions {
  maxAge?: number; // Segundos
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean; // Solo para server-side
}

/**
 * Establece una cookie en el navegador
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const {
    maxAge,
    expires,
    path = '/',
    domain,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (maxAge) {
    cookieString += `; max-age=${maxAge}`;
  }

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += `; secure`;
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Obtiene el valor de una cookie
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Elimina una cookie
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  if (typeof window === 'undefined') return;

  const { path = '/', domain } = options;
  
  setCookie(name, '', {
    maxAge: 0,
    expires: new Date(0),
    path,
    domain,
  });
}

/**
 * Obtiene todas las cookies como un objeto
 */
export function getAllCookies(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (const cookieString of cookieStrings) {
    const [name, ...valueParts] = cookieString.trim().split('=');
    if (name) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(valueParts.join('='));
    }
  }

  return cookies;
}

/**
 * Constantes para nombres de cookies comunes
 */
export const COOKIE_NAMES = {
  // Preferencias de UI
  THEME: 'holistia_theme',
  LANGUAGE: 'holistia_language',
  SIDEBAR_STATE: 'sidebar_state',
  
  // Preferencias de usuario
  ONBOARDING_COMPLETED: 'holistia_onboarding_completed',
  NOTIFICATIONS_ENABLED: 'holistia_notifications_enabled',
  
  // Analytics y tracking
  USER_CONSENT: 'holistia_user_consent',
  ANALYTICS_ENABLED: 'holistia_analytics_enabled',
  SESSION_ID: 'holistia_session_id',
  
  // UX
  LAST_VISITED_PAGE: 'holistia_last_visited',
  VIEW_PREFERENCE: 'holistia_view_preference',
  FILTERS_PREFERENCE: 'holistia_filters',
  
  // Performance
  CACHE_VERSION: 'holistia_cache_version',
} as const;

/**
 * Valores por defecto para opciones de cookies comunes
 */
export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30, // 30 días por defecto
};

/**
 * Helper para cookies de preferencias (persisten por 1 año)
 */
export function setPreferenceCookie(name: string, value: string): void {
  setCookie(name, value, {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });
}

/**
 * Helper para cookies de sesión (persisten hasta cerrar navegador)
 */
export function setSessionCookie(name: string, value: string): void {
  setCookie(name, value, {
    ...DEFAULT_COOKIE_OPTIONS,
    // Sin maxAge = cookie de sesión
  });
}

/**
 * Helper para cookies temporales (persisten por tiempo específico)
 */
export function setTemporaryCookie(
  name: string,
  value: string,
  days: number = 7
): void {
  setCookie(name, value, {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * days,
  });
}
