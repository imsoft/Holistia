# Documentación del Proyecto Holistia

Esta carpeta contiene la documentación técnica y de configuración del proyecto Holistia.

## 📁 Archivos de Documentación

### 🗺️ [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)
Guía completa para configurar Mapbox (anteriormente Google Maps) en el proyecto:
- Creación de cuenta en Mapbox
- Obtención del Access Token
- Configuración de variables de entorno
- Implementación en el proyecto

### 🏥 [PROFESSIONAL_DASHBOARD.md](./PROFESSIONAL_DASHBOARD.md)
Documentación del dashboard profesional:
- Estructura de archivos y componentes
- Características principales del sidebar
- Páginas implementadas (Dashboard, Citas, Pacientes)
- Guía de navegación y funcionalidades
- Próximos pasos de desarrollo

### 🔧 [SETUP_DATABASE.md](./SETUP_DATABASE.md)
Guía para configurar la base de datos del proyecto:
- Instrucciones de configuración inicial
- Ejecución de migraciones
- Configuración de políticas RLS

### 🔑 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
Configuración de autenticación con Google OAuth:
- Creación de credenciales en Google Cloud
- Configuración en Supabase
- Variables de entorno necesarias

### 🚨 [INSTRUCCIONES_URGENTES.md](./INSTRUCCIONES_URGENTES.md)
Guía de solución rápida para problemas comunes del dashboard de admin:
- Crear la tabla `professional_applications`
- Configurar usuario como administrador
- Insertar datos de prueba
- Verificación y troubleshooting

### 🔍 [INSTRUCCIONES_ADMIN_DASHBOARD.md](./INSTRUCCIONES_ADMIN_DASHBOARD.md)
Solución detallada de problemas del dashboard de administradores:
- Agregar campos de revisión faltantes
- Configurar políticas RLS correctamente
- Verificación de permisos
- Pasos de debugging

## 🚀 Uso de la Documentación

Cada archivo de documentación está diseñado para ser:
- **Autocontenido**: Incluye toda la información necesaria
- **Actualizable**: Fácil de mantener y actualizar
- **Específico**: Enfocado en un aspecto particular del proyecto

## 📝 Mantenimiento

Cuando agregues nuevas funcionalidades o configuraciones al proyecto, considera:
1. Actualizar la documentación existente si es relevante
2. Crear nuevos archivos `.md` para nuevas funcionalidades
3. Mantener este README actualizado con la lista de archivos

## 🔗 Enlaces Útiles

- [README Principal](../README.md) - Información general del proyecto
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Documentación de componentes UI
- [Next.js Documentation](https://nextjs.org/docs) - Documentación de Next.js
