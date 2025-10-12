# Migración: Desactivación de Cuentas

## Archivo
`39_add_account_deactivation_fields.sql`

## Descripción
Agrega campos necesarios para permitir que los usuarios desactiven sus cuentas de forma controlada.

## Implementación Usando User Metadata

En lugar de crear campos en la base de datos, usamos el campo `raw_user_meta_data` de `auth.users`:

### `auth.users.raw_user_meta_data.account_active`
- **Tipo**: BOOLEAN (en JSONB)
- **Default**: true (implícito)
- **Descripción**: Indica si la cuenta del usuario está activa
- **Uso**: Se establece en `false` cuando el usuario desactiva su cuenta

### `auth.users.raw_user_meta_data.deactivated_at`
- **Tipo**: STRING (timestamp ISO)
- **Default**: undefined
- **Descripción**: Fecha y hora en que se desactivó la cuenta
- **Uso**: Se establece cuando `account_active` cambia a `false`

## Ventajas de Usar User Metadata

1. ✅ **No requiere migración**: El campo `raw_user_meta_data` ya existe
2. ✅ **Vinculado al auth**: Los datos están directamente en el usuario de autenticación
3. ✅ **Limpieza automática**: Se elimina si se borra el usuario
4. ✅ **Fácil acceso**: Disponible en `user.user_metadata`
5. ✅ **Flexible**: Puede almacenar cualquier dato adicional

## ⚠️ No Requiere Migración SQL

Esta funcionalidad **NO requiere ejecutar ninguna migración SQL** porque:
- Usa el campo `raw_user_meta_data` de `auth.users` (ya existe)
- No se crean nuevas tablas ni columnas
- Todo se maneja a nivel de metadatos del usuario

El archivo `39_add_account_deactivation_fields.sql` está incluido solo como documentación.

## Funcionalidad Implementada

### Componente: `AccountDeactivation`
Ubicación: `src/components/ui/account-deactivation.tsx`

**Características:**
- Requiere confirmación de email para desactivar
- Muestra advertencias claras sobre las consecuencias
- Variante para pacientes y profesionales
- Cierra sesión automáticamente después de desactivar
- Redirecciona al login con parámetro `?deactivated=true`

**Ubicaciones:**
- Perfil de paciente: `/patient/[id]/explore/profile`
- Dashboard de profesional: `/professional/[id]/dashboard`

### Efectos de Desactivación

#### Para Pacientes:
- `auth.users.raw_user_meta_data.account_active` = false
- `auth.users.raw_user_meta_data.deactivated_at` = timestamp ISO
- Sesión cerrada automáticamente
- Acceso bloqueado a la plataforma

#### Para Profesionales:
- `auth.users.raw_user_meta_data.account_active` = false
- `auth.users.raw_user_meta_data.deactivated_at` = timestamp ISO
- `professional_applications.status` = 'rejected'
- Sesión cerrada automáticamente
- Perfil no visible públicamente
- No puede recibir nuevas citas

## Reactivación de Cuentas

Las cuentas desactivadas pueden ser reactivadas por:
1. Soporte técnico (hola@holistia.io)
2. Administradores desde el panel admin

Para reactivar, un administrador debe actualizar los metadatos del usuario:

**Opción 1: Usando el Dashboard de Supabase**
1. Ve a Authentication → Users
2. Busca el usuario desactivado
3. Edita User Metadata
4. Cambia `account_active` a `true`
5. Elimina el campo `deactivated_at`

**Opción 2: Usando SQL (requiere función auxiliar)**
```sql
-- Nota: Requiere crear una función para actualizar user_metadata
-- Por ahora, la reactivación debe hacerse desde el Dashboard de Supabase
```

**Opción 3: Para profesionales, también actualizar:**
```sql
UPDATE public.professional_applications
SET status = 'approved', updated_at = NOW()
WHERE user_id = '[user-id]';
```

## Seguridad

- ✅ Requiere confirmación de email
- ✅ Doble confirmación con dialog
- ✅ Advertencias claras
- ✅ Cierre de sesión automático
- ✅ No se eliminan datos, solo se desactiva

## Notas Importantes

- Los datos del usuario NO se eliminan, solo se desactiva la cuenta
- Las imágenes se mantienen en storage para posible reactivación
- Los administradores pueden ver cuentas desactivadas
- La reactivación debe ser manual por seguridad

