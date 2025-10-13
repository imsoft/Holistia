# 🔐 Persistencia de Sesión en Holistia

## 🎯 Problema Resuelto

**Síntoma**: La sesión se cierra automáticamente al cerrar el navegador o la pestaña.

**Causa**: Configuración incorrecta de cookies en el cliente de Supabase.

## ✅ Solución Implementada

Se actualizó el cliente de Supabase (`src/utils/supabase/client.ts`) para configurar correctamente las cookies con opciones de persistencia.

### Configuración de Cookies

```typescript
{
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 7,  // 7 días
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }
}
```

**Nota Importante**: No se especifica el parámetro `name` para permitir que Supabase use sus nombres de cookie predeterminados, lo cual es necesario para el correcto funcionamiento de OAuth (Google, etc.).

### Parámetros Clave

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `maxAge` | `604800` segundos | Duración de 7 días |
| `path` | `/` | Cookie disponible en toda la aplicación |
| `sameSite` | `lax` | Permite cookies en navegación normal |
| `secure` | `true` (producción) | HTTPS requerido en producción |

## 🔍 Cómo Funciona

### 1. Al Iniciar Sesión
Cuando el usuario inicia sesión:
1. Supabase Auth crea un token de sesión
2. Se almacena en una cookie con las opciones configuradas
3. La cookie persiste durante 7 días (configurable)

### 2. Al Cerrar y Volver a Abrir
Cuando el usuario regresa:
1. El navegador envía automáticamente la cookie
2. El middleware (`src/middleware.ts`) la intercepta
3. Supabase valida el token y restaura la sesión
4. El usuario continúa autenticado

### 3. Middleware de Sesión
El middleware actualiza la sesión en cada request:

```typescript
// src/utils/supabase/middleware.ts
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) { /* actualiza cookies */ }
    }
  }
);
```

## 🛠️ Verificación

### Comprobar que Funciona

1. **Iniciar sesión** en la aplicación
2. **Abrir DevTools** (F12) → Application/Almacenamiento → Cookies
3. Buscar cookies que empiecen con `sb-`
4. Verificar que tengan:
   - ✅ `Max-Age`: 604800 (7 días)
   - ✅ `Path`: /
   - ✅ `SameSite`: Lax
   - ✅ `Secure`: true (en producción)

### Probar Persistencia

1. Iniciar sesión en la aplicación
2. **Cerrar completamente el navegador**
3. Volver a abrir el navegador
4. Navegar a la aplicación
5. ✅ **Deberías seguir autenticado**

## 📊 Duración de la Sesión

### Por Defecto
- **Cookie**: 7 días
- **Token de Supabase**: Configurado en el dashboard de Supabase

### Personalizar Duración

Para cambiar la duración de la cookie, modifica en `src/utils/supabase/client.ts`:

```typescript
maxAge: 60 * 60 * 24 * 30, // 30 días
maxAge: 60 * 60 * 24 * 1,  // 1 día
maxAge: 60 * 60 * 8,       // 8 horas
```

### Token de Supabase

En el **Dashboard de Supabase** → Authentication → Settings:
- **JWT expiry time**: Duración del token JWT
- **Refresh token rotation**: Activar para mayor seguridad

## 🔒 Seguridad

### Cookies Seguras

| Entorno | Configuración |
|---------|--------------|
| **Desarrollo** | `secure: false` (permite HTTP) |
| **Producción** | `secure: true` (requiere HTTPS) |

### SameSite Protection

- **`Lax`**: Protege contra CSRF básico
- Permite cookies en navegación normal (GET)
- Bloquea cookies en peticiones cross-site (POST)

### Mejores Prácticas

1. ✅ Usar HTTPS en producción
2. ✅ Configurar `sameSite: 'lax'`
3. ✅ Usar `secure: true` en producción
4. ✅ Implementar refresh token rotation
5. ✅ Mantener el middleware actualizado

## 🐛 Solución de Problemas

### La sesión sigue cerrándose

#### Verificar Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
```

#### Verificar Middleware
El archivo `src/middleware.ts` debe:
1. Exportar `middleware` function
2. Usar `updateSession` de `src/utils/supabase/middleware.ts`
3. Tener el config correcto (matcher)

#### Limpiar Cookies
Si las cookies antiguas causan problemas:
1. DevTools → Application → Cookies
2. Eliminar todas las cookies `sb-*`
3. Volver a iniciar sesión

### Cookies no se guardan

#### Revisar Console del Navegador
```javascript
// Verificar si las cookies se están configurando
document.cookie
```

#### Revisar Network Tab
1. DevTools → Network
2. Buscar request de login
3. Ver Response Headers
4. Debe incluir `Set-Cookie` con las opciones correctas

### Error: "Secure cookie not set"

**Causa**: Intentando usar `secure: true` en HTTP

**Solución**:
```typescript
// En desarrollo, usa HTTP y secure: false
secure: process.env.NODE_ENV === 'production'
```

## 📚 Referencias

### Archivos Modificados
- [`src/utils/supabase/client.ts`](../src/utils/supabase/client.ts) - Cliente con cookies configuradas
- [`src/utils/supabase/server.ts`](../src/utils/supabase/server.ts) - Cliente del servidor
- [`src/utils/supabase/middleware.ts`](../src/utils/supabase/middleware.ts) - Actualización de sesión
- [`src/middleware.ts`](../src/middleware.ts) - Middleware de Next.js

### Documentación Oficial
- [Supabase Auth - Server-Side](https://supabase.com/docs/guides/auth/server-side)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## 💡 Tips Adicionales

### Sesión en Múltiples Dispositivos
- Cada dispositivo tiene su propia cookie
- Los tokens se sincronizan con Supabase
- El logout en un dispositivo NO afecta a otros

### Renovación Automática
- Supabase renueva automáticamente el token antes de expirar
- El middleware maneja la renovación en cada request
- No se requiere acción del usuario

### Cerrar Sesión
```typescript
const supabase = createClient();
await supabase.auth.signOut();
```

Esto:
1. Invalida el token en Supabase
2. Elimina las cookies del navegador
3. Redirige al login

---

**Última actualización**: Octubre 2025  
**Estado**: ✅ Funcionando correctamente

