-- Migración: 39_add_account_deactivation_fields
-- DESACTIVACIÓN DE CUENTAS

-- NOTA IMPORTANTE:
-- No se requiere migración SQL porque la desactivación se maneja mediante:
-- 1. auth.users.raw_user_meta_data -> { account_active: false, deactivated_at: timestamp }
-- 2. professional_applications.status -> 'rejected' (para profesionales)

-- Esta migración está vacía porque usamos el sistema de metadata de Supabase Auth
-- que no requiere cambios en el schema de la base de datos.

-- Los datos de desactivación se almacenan en:
-- - auth.users.raw_user_meta_data (campo JSONB existente)
--   * account_active: boolean (false cuando está desactivado)
--   * deactivated_at: timestamp (fecha de desactivación)

-- Para profesionales, además se actualiza:
-- - professional_applications.status = 'rejected'

-- VENTAJAS de usar user_metadata:
-- 1. No requiere cambios en el schema
-- 2. Datos vinculados directamente al usuario de auth
-- 3. Se elimina automáticamente si se borra el usuario
-- 4. Accesible desde cualquier consulta de auth.users

SELECT 'Migración no requerida - Se usa auth.users.raw_user_meta_data' as mensaje;
