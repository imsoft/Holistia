# Instrucciones para solucionar el problema del Dashboard de Administradores

## Problema
Las solicitudes de profesionales no aparecen en el dashboard de administradores.

## Causa
La tabla `professional_applications` no tiene los campos necesarios para el proceso de revisión:
- `submitted_at`
- `reviewed_at`
- `reviewed_by`
- `review_notes`

Además, las políticas RLS (Row Level Security) requieren que el usuario administrador tenga `type='admin'` en sus metadatos.

## Solución

### Paso 1: Aplicar la migración 23

1. Ve al **Dashboard de Supabase** → **SQL Editor**
2. Copia y pega el contenido del archivo `23_add_review_fields_to_professional_applications.sql`
3. Haz clic en **Run** para ejecutar la migración

### Paso 2: Verificar que el usuario administrador tenga el tipo correcto

Ejecuta el siguiente SQL para verificar tu usuario:

```sql
SELECT id, email, raw_user_meta_data->>'type' as user_type
FROM auth.users
WHERE email = 'TU_EMAIL_ADMIN_AQUI';
```

Si el campo `user_type` es `NULL` o no es `'admin'`, necesitas actualizarlo:

```sql
-- Reemplaza 'TU_EMAIL_ADMIN_AQUI' con tu email de administrador
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'TU_EMAIL_ADMIN_AQUI';
```

### Paso 3: Verificar que las políticas RLS estén activas

Ejecuta este SQL para verificar las políticas:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'professional_applications'
AND policyname LIKE '%Admin%';
```

Deberías ver dos políticas:
- `Admins can view all applications`
- `Admins can update all applications`

### Paso 4: Verificar que haya solicitudes en la tabla

```sql
SELECT id, first_name, last_name, email, profession, status, created_at, submitted_at
FROM public.professional_applications
ORDER BY created_at DESC;
```

### Paso 5: Cerrar sesión y volver a iniciar sesión

Después de aplicar los cambios, cierra sesión en tu aplicación y vuelve a iniciar sesión para que los cambios en los metadatos se apliquen.

## Verificación Final

Después de completar todos los pasos:

1. Inicia sesión como administrador
2. Ve al dashboard de administradores: `/admin/[tu-id]/dashboard`
3. Deberías ver las solicitudes en la sección "Solicitudes Recientes"
4. También puedes ir a `/admin/[tu-id]/applications` para ver todas las solicitudes

## Solución de Problemas

### Si aún no ves las solicitudes:

1. **Verifica la consola del navegador** para ver errores
2. **Revisa los logs de Supabase**: Dashboard → Logs → Postgres Logs
3. **Ejecuta esta consulta para debug**:

```sql
-- Verifica tus permisos
SELECT 
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
  (SELECT raw_user_meta_data->>'type' FROM auth.users WHERE id = auth.uid()) as user_type,
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'type' = 'admin')
  ) as is_admin;
```

### Si el problema persiste:

Ejecuta este SQL para deshabilitar temporalmente RLS y verificar que los datos existen:

```sql
-- SOLO PARA DEBUG - NO DEJAR EN PRODUCCIÓN
ALTER TABLE professional_applications DISABLE ROW LEVEL SECURITY;

-- Verifica que puedes ver los datos
SELECT COUNT(*) FROM professional_applications;

-- Vuelve a habilitar RLS
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;
```

## Contacto

Si necesitas ayuda adicional, revisa:
- Los logs de la aplicación
- Los logs de Supabase
- El código en `src/app/(dashboard)/(admin)/admin/[id]/dashboard/page.tsx`

