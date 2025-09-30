# Configuración de Google OAuth

## Pasos para configurar Google OAuth en Supabase

### 1. Configuración en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Selecciona **Web application** como tipo de aplicación

### 2. Configurar el OAuth Client

#### Authorized JavaScript origins:
- `http://localhost:3000` (para desarrollo)
- `https://tu-dominio.com` (para producción)

#### Authorized redirect URIs:
- `https://tu-proyecto-supabase.supabase.co/auth/v1/callback`
- Para desarrollo local: `http://localhost:54321/auth/v1/callback` (si usas Supabase local)

### 3. Configurar en Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Navega a **Authentication** > **Providers**
3. Encuentra **Google** y haz clic en **Configure**
4. Ingresa tu **Client ID** y **Client Secret** de Google
5. Haz clic en **Save**

### 4. Variables de entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Google OAuth (opcional para desarrollo local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Configuración local (opcional)

Si estás usando Supabase local, agrega esto a tu `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "tu-google-client-id"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

## Funcionalidades implementadas

### ✅ Completado:
- [x] Acción server para Google OAuth (`signInWithGoogle`)
- [x] Callback route para manejar la respuesta de Google
- [x] Componente `GoogleButton` reutilizable
- [x] Botones de Google en páginas de login y signup
- [x] Redirección automática al dashboard después del login
- [x] Manejo de errores y estados de carga

### 🚀 Flujo de autenticación:

1. **Usuario hace clic en "Continuar con Google"**
2. **Redirección a Google** → Usuario autoriza la aplicación
3. **Callback de Google** → Supabase procesa el código de autorización
4. **Redirección al dashboard** → `/patient/{user.id}/explore`

### 🔧 Características técnicas:

- **PKCE Flow**: Implementado para mayor seguridad
- **Refresh tokens**: Configurado para acceso offline
- **Nonce validation**: Habilitado para prevenir ataques
- **Error handling**: Manejo completo de errores
- **Loading states**: Estados de carga en los botones
- **Responsive design**: Botones adaptados a diferentes pantallas

## Próximos pasos

1. **Configurar Google Cloud Console** siguiendo los pasos arriba
2. **Agregar las credenciales** en Supabase Dashboard
3. **Configurar variables de entorno** en tu proyecto
4. **Probar el flujo** en desarrollo local
5. **Configurar URLs de producción** cuando despliegues

## Solución de problemas

### Error: "Invalid client"
- Verifica que el Client ID sea correcto
- Asegúrate de que la URL de callback esté en la lista de URIs autorizados

### Error: "Redirect URI mismatch"
- Agrega la URL de callback de Supabase a las URIs autorizados en Google Console
- Verifica que no haya espacios extra o caracteres incorrectos

### Error: "Access blocked"
- Verifica que el consent screen esté configurado
- Asegúrate de que tu aplicación esté en modo de prueba o verificada

### El usuario no es redirigido al dashboard
- Verifica que el callback route esté funcionando correctamente
- Revisa los logs del servidor para errores
