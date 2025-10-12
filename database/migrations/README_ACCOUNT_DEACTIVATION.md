# Migración: Desactivación de Cuentas

## Archivo
`39_add_account_deactivation_fields.sql`

## Descripción
Agrega campos necesarios para permitir que los usuarios desactiven sus cuentas de forma controlada.

## Campos Utilizados y Agregados

### `profiles.activo` (EXISTENTE)
- **Tipo**: BOOLEAN
- **Default**: true
- **Descripción**: Indica si la cuenta del usuario está activa
- **Uso**: Se establece en `false` cuando el usuario desactiva su cuenta
- **Nota**: Este campo ya existía en la tabla

### `profiles.deactivated_at` (NUEVO)
- **Tipo**: TIMESTAMPTZ
- **Default**: NULL
- **Descripción**: Fecha y hora en que se desactivó la cuenta
- **Uso**: Se establece cuando `activo` cambia a `false`

## Índices Creados

### `idx_profiles_activo`
- **Columna**: activo
- **Propósito**: Optimizar consultas que filtran por cuentas activas

## Cómo Aplicar la Migración

### Opción 1: SQL Editor en Supabase Dashboard
1. Ve a tu proyecto en Supabase
2. Navega a SQL Editor
3. Copia y pega el contenido de `39_add_account_deactivation_fields.sql`
4. Ejecuta la query

### Opción 2: Línea de Comandos
```bash
psql -h [tu-host] -U postgres -d postgres < 39_add_account_deactivation_fields.sql
```

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
- `profiles.activo` = false
- `profiles.updated_at` = timestamp actual
- Sesión cerrada
- Acceso bloqueado a la plataforma

#### Para Profesionales:
- `profiles.activo` = false
- `profiles.updated_at` = timestamp actual
- `professional_applications.status` = 'rejected'
- Sesión cerrada
- Perfil no visible públicamente
- No puede recibir nuevas citas

## Reactivación de Cuentas

Las cuentas desactivadas pueden ser reactivadas por:
1. Soporte técnico (hola@holistia.io)
2. Administradores desde el panel admin

Para reactivar:
```sql
UPDATE public.profiles
SET activo = true, deactivated_at = NULL
WHERE id = '[user-id]';
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

