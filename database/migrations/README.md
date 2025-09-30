# Migraciones de Base de Datos

Esta carpeta contiene las migraciones SQL para la base de datos de Holistia.

## Orden de ejecución

Ejecuta los archivos en el siguiente orden:

### 1. `01_create_professional_applications_table.sql`
- **Propósito**: Crear la tabla principal de solicitudes de profesionales
- **Uso**: Primera instalación o creación desde cero
- **Resultado**: Tabla `professional_applications` con políticas RLS

### 2. `02_fix_auth_users_permissions.sql`
- **Propósito**: Solucionar errores de permisos en `auth.users`
- **Uso**: Cuando obtengas "permission denied for table users"
- **Resultado**: Permisos correctos para el rol `authenticated`

### 3. `03_complete_professional_applications_setup.sql`
- **Propósito**: Solución completa que recrea la tabla si es necesario
- **Uso**: Cuando la tabla existe pero tiene problemas de estructura
- **Resultado**: Tabla completamente funcional con todos los permisos

### 4. `04_create_user_favorites_table.sql`
- **Propósito**: Crear la tabla de favoritos de usuarios
- **Uso**: Para funcionalidad de favoritos en la aplicación
- **Resultado**: Tabla `user_favorites` con políticas RLS configuradas

### 5. `05_create_appointments_table.sql`
- **Propósito**: Crear la tabla de citas (appointments)
- **Uso**: Para funcionalidad de gestión de citas
- **Resultado**: Tabla `appointments` con políticas RLS configuradas

### 6. `06_add_admin_policies_for_profiles.sql`
- **Propósito**: Permitir que administradores vean y actualicen todos los perfiles
- **Uso**: Para funcionalidad de administración de usuarios
- **Resultado**: Políticas RLS que permiten acceso completo a administradores

## Instrucciones rápidas

### Para una instalación nueva:
```bash
# En el SQL Editor de Supabase, ejecuta:
1. 01_create_professional_applications_table.sql
2. 02_fix_auth_users_permissions.sql
4. 04_create_user_favorites_table.sql
5. 05_create_appointments_table.sql
6. 06_add_admin_policies_for_profiles.sql
```

### Para solucionar errores de permisos:
```bash
# En el SQL Editor de Supabase, ejecuta:
2. 02_fix_auth_users_permissions.sql
```

### Para recrear completamente:
```bash
# En el SQL Editor de Supabase, ejecuta:
3. 03_complete_professional_applications_setup.sql
```

## Notas importantes

- ⚠️ El archivo 03 borra y recrea la tabla (pierdes datos existentes)
- ✅ Los archivos 01 y 02 son seguros de ejecutar múltiples veces
- 🔒 Todas las migraciones incluyen políticas de seguridad RLS
- 📝 Cada archivo tiene comentarios explicativos detallados
