# 🍪 Uso de Cookies en Holistia

## 📋 Resumen

Este documento describe cómo se utilizan las cookies en el proyecto Holistia y qué oportunidades existen para mejorar la experiencia del usuario mediante el uso estratégico de cookies.

## 🔍 Estado Actual

### Cookies Existentes

1. **Autenticación (Supabase)**
   - `sb-*-auth-token`: Token de sesión de Supabase
   - `sb-*-auth-token-code-verifier`: Verificador PKCE para OAuth
   - **Manejadas automáticamente por Supabase SSR**
   - **No modificar manualmente**

2. **Estado del Sidebar**
   - `sidebar_state`: Recuerda si el sidebar está abierto/cerrado
   - **Duración**: 7 días
   - **Ubicación**: `src/components/ui/sidebar.tsx`

3. **Google Calendar OAuth**
   - Cookies temporales para el flujo de autenticación
   - **Ubicación**: `src/app/api/google-calendar/auth/route.ts`

## 🛠️ Utilidad de Cookies

Se ha creado una utilidad centralizada en `src/lib/cookies.ts` que proporciona:

- ✅ Funciones helper consistentes (`setCookie`, `getCookie`, `deleteCookie`)
- ✅ Constantes para nombres de cookies comunes
- ✅ Helpers especializados (`setPreferenceCookie`, `setSessionCookie`, `setTemporaryCookie`)
- ✅ Configuración de seguridad por defecto (Secure, SameSite)

## 💡 Oportunidades de Mejora

### 1. Preferencias de Usuario

#### A. Tema (Dark/Light Mode)
```typescript
// Guardar preferencia de tema
import { setPreferenceCookie, getCookie, COOKIE_NAMES } from '@/lib/cookies';

// Al cambiar tema
setPreferenceCookie(COOKIE_NAMES.THEME, 'dark' | 'light');

// Al cargar página
const savedTheme = getCookie(COOKIE_NAMES.THEME) || 'system';
```

**Beneficio**: El usuario mantiene su preferencia de tema entre sesiones.

#### B. Idioma
```typescript
// Guardar preferencia de idioma
setPreferenceCookie(COOKIE_NAMES.LANGUAGE, 'es' | 'en');
```

**Beneficio**: Recordar el idioma preferido del usuario.

### 2. Mejora de UX

#### A. Onboarding
```typescript
// Marcar onboarding como completado
setPreferenceCookie(COOKIE_NAMES.ONBOARDING_COMPLETED, 'true');

// Verificar si mostrar tutoriales
const onboardingCompleted = getCookie(COOKIE_NAMES.ONBOARDING_COMPLETED) === 'true';
```

**Beneficio**: No mostrar tutoriales repetidamente a usuarios que ya los completaron.

#### B. Última Página Visitada
```typescript
// Guardar última página visitada
setSessionCookie(COOKIE_NAMES.LAST_VISITED_PAGE, currentPath);

// Redirigir después de login
const lastPage = getCookie(COOKIE_NAMES.LAST_VISITED_PAGE);
if (lastPage) router.push(lastPage);
```

**Beneficio**: Redirigir al usuario a donde estaba antes de hacer login.

#### C. Preferencias de Vista
```typescript
// Guardar preferencia de vista (grid/list)
setPreferenceCookie(COOKIE_NAMES.VIEW_PREFERENCE, 'grid' | 'list');

// Aplicar en páginas de exploración
const viewPreference = getCookie(COOKIE_NAMES.VIEW_PREFERENCE) || 'grid';
```

**Beneficio**: Recordar cómo el usuario prefiere ver listados (grid o lista).

#### D. Filtros Guardados
```typescript
// Guardar filtros aplicados en páginas de exploración
setTemporaryCookie(COOKIE_NAMES.FILTERS_PREFERENCE, JSON.stringify(filters), 1);

// Restaurar filtros al volver a la página
const savedFilters = getCookie(COOKIE_NAMES.FILTERS_PREFERENCE);
if (savedFilters) {
  const filters = JSON.parse(savedFilters);
  // Aplicar filtros
}
```

**Beneficio**: Recordar filtros aplicados por el usuario (ej: en exploración de profesionales).

### 3. Analytics y Tracking (con Consentimiento)

#### A. Consentimiento de Usuario
```typescript
// Guardar consentimiento del usuario (GDPR/LGPD)
setPreferenceCookie(COOKIE_NAMES.USER_CONSENT, JSON.stringify({
  necessary: true,
  analytics: userConsented,
  marketing: userConsented,
  timestamp: new Date().toISOString()
}));
```

**Beneficio**: Cumplir con regulaciones de privacidad (GDPR, LGPD).

#### B. Session ID
```typescript
// Generar ID de sesión único
const sessionId = getCookie(COOKIE_NAMES.SESSION_ID) || generateSessionId();
setSessionCookie(COOKIE_NAMES.SESSION_ID, sessionId);
```

**Beneficio**: Tracking de sesiones para analytics (con consentimiento).

### 4. Performance

#### A. Cache Version
```typescript
// Invalidar cache cuando sea necesario
const currentCacheVersion = '1.0.0';
const savedVersion = getCookie(COOKIE_NAMES.CACHE_VERSION);

if (savedVersion !== currentCacheVersion) {
  // Limpiar cache local
  localStorage.clear();
  setPreferenceCookie(COOKIE_NAMES.CACHE_VERSION, currentCacheVersion);
}
```

**Beneficio**: Invalidar cache cuando se actualiza la aplicación.

## 📝 Ejemplos de Implementación

### Ejemplo 1: Tema Dark/Light

```typescript
// src/hooks/use-theme.ts
'use client';

import { useEffect, useState } from 'react';
import { getCookie, setPreferenceCookie, COOKIE_NAMES } from '@/lib/cookies';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Cargar tema guardado
    const savedTheme = getCookie(COOKIE_NAMES.THEME);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme !== 'system') {
      setPreferenceCookie(COOKIE_NAMES.THEME, newTheme);
      applyTheme(newTheme);
    }
  };

  return { theme, changeTheme };
}
```

### Ejemplo 2: Guardar Filtros

```typescript
// En página de exploración
import { getCookie, setTemporaryCookie, COOKIE_NAMES } from '@/lib/cookies';

// Al aplicar filtros
const handleFiltersChange = (filters: FilterState) => {
  setTemporaryCookie(
    COOKIE_NAMES.FILTERS_PREFERENCE, 
    JSON.stringify(filters), 
    1 // 1 día
  );
};

// Al cargar página
useEffect(() => {
  const savedFilters = getCookie(COOKIE_NAMES.FILTERS_PREFERENCE);
  if (savedFilters) {
    try {
      const filters = JSON.parse(savedFilters);
      setFilters(filters);
    } catch (error) {
      console.error('Error parsing saved filters:', error);
    }
  }
}, []);
```

### Ejemplo 3: Consentimiento de Cookies

```typescript
// src/components/ui/cookie-consent.tsx
'use client';

import { useState, useEffect } from 'react';
import { getCookie, setPreferenceCookie, COOKIE_NAMES } from '@/lib/cookies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookie(COOKIE_NAMES.USER_CONSENT);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = (analytics: boolean) => {
    setPreferenceCookie(COOKIE_NAMES.USER_CONSENT, JSON.stringify({
      necessary: true,
      analytics,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-md">
      <CardHeader>
        <CardTitle>Configuración de Cookies</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">
          Utilizamos cookies para mejorar tu experiencia...
        </p>
        <div className="flex gap-2">
          <Button onClick={() => handleAccept(false)} variant="outline">
            Solo Necesarias
          </Button>
          <Button onClick={() => handleAccept(true)}>
            Aceptar Todas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔒 Seguridad y Privacidad

### Mejores Prácticas

1. **Nunca guardar información sensible** en cookies del cliente
   - ❌ No guardar tokens de acceso
   - ❌ No guardar contraseñas
   - ❌ No guardar información personal identificable (PII) sin consentimiento

2. **Usar cookies seguras en producción**
   - ✅ `secure: true` en producción (HTTPS)
   - ✅ `sameSite: 'lax'` para protección CSRF
   - ✅ `httpOnly: true` para cookies del servidor (no accesibles desde JS)

3. **Respetar consentimiento del usuario**
   - ✅ Solo usar cookies necesarias sin consentimiento
   - ✅ Solicitar consentimiento para analytics/marketing
   - ✅ Permitir al usuario revocar consentimiento

4. **Limpiar cookies obsoletas**
   - ✅ Eliminar cookies cuando ya no son necesarias
   - ✅ Actualizar versiones de cookies cuando cambia la estructura

## 📊 Comparación: Cookies vs LocalStorage vs SessionStorage

| Característica | Cookies | LocalStorage | SessionStorage |
|---------------|---------|--------------|----------------|
| **Enviado al servidor** | ✅ Automático | ❌ No | ❌ No |
| **Persistencia** | Configurable | Persiste | Solo sesión |
| **Tamaño límite** | ~4KB | ~5-10MB | ~5-10MB |
| **Acceso desde servidor** | ✅ Sí | ❌ No | ❌ No |
| **Expiración** | ✅ Configurable | ❌ Manual | ❌ Al cerrar pestaña |
| **Uso recomendado** | Preferencias, auth | Datos grandes | Datos temporales |

### Cuándo Usar Cada Uno

- **Cookies**: Preferencias que el servidor necesita conocer, autenticación, tracking con consentimiento
- **LocalStorage**: Datos grandes del cliente, cache de datos, preferencias que no necesita el servidor
- **SessionStorage**: Datos temporales de la sesión, estado de formularios, datos que deben limpiarse al cerrar

## 🚀 Próximos Pasos Recomendados

1. **Implementar banner de consentimiento de cookies** (GDPR/LGPD compliance)
2. **Agregar toggle de tema dark/light** con persistencia en cookie
3. **Guardar preferencias de filtros** en páginas de exploración
4. **Implementar redirección inteligente** basada en última página visitada
5. **Agregar preferencias de vista** (grid/list) en listados
6. **Mejorar onboarding** con cookies para no mostrar tutoriales repetidos

## 📚 Referencias

- [MDN - Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Next.js - Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Supabase SSR - Session Management](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [GDPR Cookie Consent](https://gdpr.eu/cookies/)
