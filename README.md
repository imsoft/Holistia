# Holistia - Web

Aplicación web de **Holistia**, plataforma integral de bienestar que conecta profesionales de la salud con personas que buscan mejorar su calidad de vida. Holistia facilita la gestión de citas, eventos y pagos para terapeutas, coaches y especialistas en bienestar.

> **Nota:** La app móvil (iOS y Android) está en el repositorio [Holistia-App](../Holistia-App). Ambas comparten la misma base de datos y lógica de negocio.

## Características Principales

### Para Pacientes/Usuarios
- Explorar y descubrir profesionales de bienestar (expertos)
- Agendar citas con profesionales verificados
- Registrarse a eventos y talleres
- Sistema de favoritos para profesionales, programas, eventos, restaurantes y centros holísticos
- Gestión de citas y eventos registrados
- Perfil personal editable
- Sistema de mensajería directa con profesionales
- Crear y participar en retos de bienestar
- Formar equipos para retos
- Sistema de seguimiento (follows) de usuarios y expertos
- Feed social con publicaciones de check-ins de retos
- Sistema de preguntas y respuestas en eventos
- Explorar programas digitales, restaurantes y centros holísticos

### Para Profesionales
- Gestión de servicios (sesiones individuales, programas o cotizaciones)
- Configuración de disponibilidad y horarios
- Sincronización con Google Calendar
- Gestión de citas y pacientes
- Creación y organización de eventos
- Sistema de preguntas y respuestas en eventos
- Galería de fotos profesional
- Integración con Stripe Connect para pagos
- Dashboard con métricas y gestión
- Sistema de mensajería directa con pacientes
- Crear retos de bienestar para pacientes
- Agregar pacientes existentes a retos

### Para Administradores
- Revisión y aprobación de aplicaciones de profesionales
- Gestión del directorio de profesionales
- Gestión de usuarios del sistema
- Sistema de blog con editor de texto enriquecido
- Moderación de eventos
- Seguimiento de registros a eventos
- Estadísticas y métricas del sistema

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 15.5.6 (App Router con Turbopack)
- **React:** 19.2.0
- **TypeScript:** 5
- **Estilos:** Tailwind CSS 4
- **Componentes UI:** Radix UI + shadcn/ui
- **Iconos:** Lucide React
- **Editor:** Tiptap (editor de texto enriquecido)
- **Formularios:** React Hook Form + Zod
- **Mapas:** Mapbox GL

### Backend
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth con verificación por email
- **Almacenamiento:** Supabase Storage
- **API Routes:** Next.js API Routes
- **Seguridad:** Row-Level Security (RLS) en Supabase

### Integraciones
- **Pagos:** Stripe + Stripe Connect (comisiones: 15% citas, 20% eventos)
- **Email:** Resend API con templates HTML personalizados
- **Analytics:** Vercel Analytics + Google Analytics 4
- **Maps:** Mapbox GL para visualización de ubicaciones
- **Calendario:** Google Calendar API para sincronización de citas

## Configuración del Proyecto

### Prerequisitos
- Node.js 18+
- npm, yarn, pnpm o bun
- Cuenta de Supabase
- Cuenta de Stripe (con Stripe Connect configurado)
- API keys de Mapbox y Resend

### Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Stripe
STRIPE_SECRET_KEY=tu_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=tu_webhook_secret

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=tu_mapbox_token

# Resend (Email)
RESEND_API_KEY=tu_resend_api_key

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=tu_ga_id

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instalación

```bash
# Clonar el repositorio
git clone [repository-url]

# Instalar dependencias
npm install
# o
yarn install
# o
pnpm install
```

### Ejecutar en Desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build para Producción

```bash
pnpm run build
pnpm run start
```

## Estructura del Proyecto

```
/src
  /app
    /(auth)              # Páginas de autenticación (login, signup)
    /(website)           # Sitio público (home, blog, contacto)
    /(dashboard)
      /(admin)          # Panel de administración
      /(professional)   # Dashboard de profesionales
      /(patient)        # Portal de pacientes/usuarios
    /api
      /stripe           # Endpoints de pagos
      /contact          # Formulario de contacto
  /components
    /ui                 # Componentes reutilizables
    /shared             # Componentes compartidos (navbar, footer)
  /types                # Definiciones de TypeScript
  /lib                  # Utilidades (stripe, email, auth)
  /utils
    /supabase          # Configuración de Supabase
  /hooks                # Custom React hooks
  /actions              # Server actions
```

## Flujos Principales

### Reserva de Cita
1. El paciente busca y selecciona un profesional
2. Elige un servicio y horario disponible
3. Completa el checkout con Stripe
4. Se procesa el pago con comisión del 15%
5. Se confirma la cita vía email

### Registro a Evento
1. El usuario descubre un evento
2. Se registra y proporciona detalles
3. Procesa el pago (comisión del 20%)
4. Recibe código de confirmación por email

### Onboarding de Profesional
1. El usuario aplica como profesional
2. Envía credenciales y documentación
3. Admin revisa la aplicación
4. Aprobación/rechazo
5. Configuración de servicios
6. Conexión con Stripe Connect
7. Activación en la plataforma

## Base de Datos

### Tablas Principales
- `auth.users` - Usuarios del sistema
- `profiles` - Perfiles de usuarios (pacientes, profesionales, admins)
- `professional_applications` - Perfiles y aplicaciones de profesionales
- `appointments` - Reservas de citas
- `professional_services` - Servicios ofrecidos (con opción de cotización)
- `availability_blocks` - Bloques de tiempo no disponibles
- `events_workshops` - Eventos y talleres
- `event_registrations` - Registros a eventos
- `event_questions` - Preguntas y respuestas en eventos
- `payments` - Transacciones de pago
- `user_favorites` - Favoritos (profesionales, programas, eventos, restaurantes, centros)
- `blog_posts` - Artículos del blog
- `stripe_connect_accounts` - Cuentas de Stripe Connect
- `challenges` - Retos de bienestar
- `challenge_purchases` - Compras/participaciones en retos
- `challenge_checkins` - Check-ins de progreso en retos
- `challenge_teams` - Equipos de retos
- `challenge_team_members` - Miembros de equipos
- `direct_conversations` - Conversaciones de mensajería directa
- `direct_messages` - Mensajes individuales
- `user_follows` - Sistema de seguimiento entre usuarios
- `social_feed_checkins` - Publicaciones en el feed social

## Administración

### Crear Usuario Admin

Para otorgar permisos de administrador a un usuario, ejecuta en tu consola SQL de Supabase:

```sql
-- Hacer admin a un usuario
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"user_type": "admin"}'::jsonb
WHERE email = 'email@ejemplo.com';

-- Verificar que funcionó
SELECT email, raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = 'email@ejemplo.com';
```

## Deployment

La aplicación está optimizada para despliegue en [Vercel](https://vercel.com):

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente en cada push a main

Para webhooks de Stripe, configura la URL:
```
https://tu-dominio.com/api/stripe/webhook
```

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Stripe Connect](https://stripe.com/docs/connect)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

## Licencia

Todos los derechos reservados - Holistia
