# 📚 Documentación de Holistia

Bienvenido a la documentación técnica del proyecto Holistia - Plataforma de bienestar y salud mental.

## 📋 Índice de Documentación

### 🗄️ Base de Datos
| Documento | Descripción |
|-----------|-------------|
| **[SETUP_DATABASE.md](./SETUP_DATABASE.md)** | Guía completa de configuración de base de datos, migraciones y RLS |

### 🗺️ Mapas y Geolocalización
| Documento | Descripción |
|-----------|-------------|
| **[MAPBOX_SETUP.md](./MAPBOX_SETUP.md)** | Configuración de Mapbox para servicios profesionales |
| **[MAPBOX_PRODUCTION_SETUP.md](./MAPBOX_PRODUCTION_SETUP.md)** | Configuración de Mapbox para producción |

### 🔐 Autenticación
| Documento | Descripción |
|-----------|-------------|
| **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** | Configuración de Google OAuth 2.0 |
| **[SESSION_PERSISTENCE.md](./SESSION_PERSISTENCE.md)** | Solución para mantener la sesión activa |

### 💼 Funcionalidades Específicas
| Documento | Descripción |
|-----------|-------------|
| **[PROFESSIONAL_DASHBOARD.md](./PROFESSIONAL_DASHBOARD.md)** | Dashboard del profesional - estructura y funcionalidades |
| **[EVENT_EMAIL_SYSTEM.md](./EVENT_EMAIL_SYSTEM.md)** | Sistema de emails para confirmación de eventos |

## 🚀 Primeros Pasos

### Para Nuevos Desarrolladores

1. **Configurar Base de Datos**
   - Lee [`SETUP_DATABASE.md`](./SETUP_DATABASE.md)
   - Ejecuta las migraciones necesarias
   - Configura tu usuario como admin

2. **Configurar Servicios Externos**
   - Mapbox: [`MAPBOX_PRODUCTION_SETUP.md`](./MAPBOX_PRODUCTION_SETUP.md)
   - Google OAuth: [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md)

3. **Explorar la Aplicación**
   - Dashboard Profesional: [`PROFESSIONAL_DASHBOARD.md`](./PROFESSIONAL_DASHBOARD.md)
   - Sistema de Eventos: [`EVENT_EMAIL_SYSTEM.md`](./EVENT_EMAIL_SYSTEM.md)

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico
- **Framework**: Next.js 15 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **UI**: Tailwind CSS + shadcn/ui
- **Mapas**: Mapbox GL JS
- **Pagos**: Stripe
- **Email**: Resend

### Estructura de Carpetas
```
holistia/
├── src/
│   ├── app/              # Rutas y páginas (App Router)
│   ├── components/       # Componentes React reutilizables
│   ├── lib/              # Utilidades y configuraciones
│   ├── types/            # Definiciones de TypeScript
│   └── utils/            # Funciones helper
├── database/             # Migraciones y esquemas SQL
├── docs/                 # Esta carpeta - Documentación
└── public/               # Archivos estáticos
```

## 📖 Documentos por Categoría

### 🔧 Configuración Inicial (Setup)
- [SETUP_DATABASE.md](./SETUP_DATABASE.md) - Base de datos y migraciones
- [MAPBOX_PRODUCTION_SETUP.md](./MAPBOX_PRODUCTION_SETUP.md) - Mapbox para mapas
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - OAuth de Google
- [SESSION_PERSISTENCE.md](./SESSION_PERSISTENCE.md) - Persistencia de sesión

### 👨‍💼 Funcionalidades de Usuario
- [PROFESSIONAL_DASHBOARD.md](./PROFESSIONAL_DASHBOARD.md) - Dashboard del profesional
- [EVENT_EMAIL_SYSTEM.md](./EVENT_EMAIL_SYSTEM.md) - Sistema de emails de eventos

### 📍 Mapas y Geolocalización
- [MAPBOX_SETUP.md](./MAPBOX_SETUP.md) - Configuración de Mapbox para servicios profesionales
- [MAPBOX_PRODUCTION_SETUP.md](./MAPBOX_PRODUCTION_SETUP.md) - Configuración de Mapbox para producción

## 🔍 Recursos Adicionales

### En Base de Datos
- [`../database/README.md`](../database/README.md) - Visión general de la base de datos
- [`../database/migrations/README.md`](../database/migrations/README.md) - Índice de migraciones

### Plantillas de Email
- [`../database/email-templates/`](../database/email-templates/) - Plantillas HTML de emails

## 💡 Tips para Desarrolladores

### Trabajando con la Base de Datos
1. **Siempre usa migraciones** - No modifiques tablas manualmente
2. **Prueba en desarrollo** - Usa branches de Supabase si es posible
3. **Documenta cambios** - Actualiza los READMEs cuando agregues migraciones
4. **Verifica RLS** - Asegúrate de que las políticas sean correctas

### Trabajando con Storage
1. **Nombres consistentes** - Sigue el patrón `{user_id}/filename`
2. **Limpieza automática** - Las imágenes se eliminan al borrar registros
3. **Políticas públicas** - Lectura pública, escritura autenticada
4. **Límites de tamaño** - 2MB para fotos de perfil, más para eventos

### Trabajando con Auth
1. **User Metadata** - Usa `raw_user_meta_data` para datos personalizados
2. **Roles** - Define en metadata: `type: 'admin' | 'professional' | 'patient'`
3. **Logout después de cambios** - Los cambios de metadata requieren nueva sesión
4. **No modifiques auth.users** - Usa las funciones de Supabase Auth

## 🆘 Soporte y Ayuda

### Problemas Comunes

**Dashboard de Admin vacío**
→ Lee: [SETUP_DATABASE.md#configurar-usuario-administrador](./SETUP_DATABASE.md)

**Error de permisos en RLS**
→ Lee: [SETUP_DATABASE.md#políticas-rls](./SETUP_DATABASE.md)

**Mapas no funcionan**
→ Lee: [MAPBOX_PRODUCTION_SETUP.md](./MAPBOX_PRODUCTION_SETUP.md)

**OAuth no funciona**
→ Lee: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

### Recursos Externos
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

## 🔄 Mantenimiento de Docs

Al agregar nueva funcionalidad:
1. ✅ Crear documento específico si es complejo
2. ✅ Actualizar este README con el nuevo documento
3. ✅ Categorizar apropiadamente
4. ✅ Incluir ejemplos de código cuando sea relevante

---

**Proyecto**: Holistia  
**Última actualización**: Octubre 2025  
**Total de documentos**: 8
