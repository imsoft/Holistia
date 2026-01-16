# 🔐 Solución: Sesión Expira Después de 30 Minutos

## 🎯 Problema

La sesión se cierra automáticamente después de aproximadamente 30 minutos cuando el usuario recarga la página, redirigiendo al login.

## 🔍 Causa

El token JWT de Supabase tiene un tiempo de expiración configurado (por defecto 1 hora, pero puede estar en 30 minutos). Si el token expira y no se renueva automáticamente, el middleware redirige al login.

## ✅ Soluciones

### 1. Aumentar JWT Expiry Time en Supabase Dashboard (RECOMENDADO)

1. Ve a tu **Supabase Dashboard** → **Authentication** → **Settings** → **Advanced Settings**
2. Busca **"JWT expiry limit"** o **"JWT expiry time"**
3. Cambia el valor:
   - **Actual**: Probablemente `1800` (30 min) o `3600` (1 hora)
   - **Recomendado**: `604800` (7 días) - máximo permitido
4. **Guarda los cambios**

### 2. Verificar Configuración de Refresh Token

El cliente SSR de Supabase debería renovar automáticamente los tokens. Verifica que:

- ✅ El cliente usa `@supabase/ssr` (ya está configurado)
- ✅ Las cookies se están manejando correctamente en el middleware
- ✅ No hay errores en la consola del navegador relacionados con tokens

### 3. Verificar Middleware

El middleware en `src/utils/supabase/session.ts` debería:
- ✅ Actualizar la sesión en cada request
- ✅ Renovar tokens automáticamente cuando sea necesario
- ✅ Manejar errores de autenticación sin redirigir inmediatamente

## 🔧 Configuración Actual

### Cliente del Navegador (`src/utils/supabase/client.ts`)
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

**Nota**: `createBrowserClient` de `@supabase/ssr` maneja automáticamente:
- ✅ `persistSession: true` (por defecto)
- ✅ `autoRefreshToken: true` (por defecto)

### Cliente del Servidor (`src/utils/supabase/server.ts`)
```typescript
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { /* actualiza cookies */ }
      },
    }
  );
}
```

## 📊 Valores Recomendados

| Configuración | Valor Recomendado | Descripción |
|---------------|-------------------|-------------|
| **JWT Expiry Time** | `604800` (7 días) | Duración del token de acceso |
| **Refresh Token Rotation** | Activado | Mayor seguridad |
| **Cookie Max-Age** | `604800` (7 días) | Duración de la cookie (ya configurado) |

## 🧪 Verificación

1. **Inicia sesión** en la aplicación
2. **Espera 30-60 minutos** sin interactuar
3. **Recarga la página**
4. ✅ **Deberías seguir autenticado** (si el JWT expiry está configurado correctamente)

## ⚠️ Notas Importantes

- El **JWT expiry time** es el tiempo máximo que un token de acceso es válido
- El **refresh token** puede renovar el JWT automáticamente, pero solo si el refresh token no ha expirado
- Si el refresh token también expira, el usuario debe iniciar sesión nuevamente
- Para sesiones muy largas, considera implementar "Remember Me" con refresh tokens de larga duración

## 🔒 Seguridad

- No aumentes el JWT expiry time más allá de 7 días sin justificación de seguridad
- Considera implementar "Remember Me" para sesiones más largas
- Monitorea intentos de acceso no autorizados
