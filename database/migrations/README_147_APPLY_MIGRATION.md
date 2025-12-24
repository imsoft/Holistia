# ⚠️ IMPORTANTE: Ejecutar Migración 147 para Acceso Público a Especialidades

## Problema
Las páginas de especialidades (`/specialties/[slug]`) están dando error 404 porque los usuarios anónimos no pueden acceder a la tabla `professional_applications` debido a las políticas RLS (Row Level Security).

## Solución
Ejecutar la migración `147_add_public_access_to_professional_applications.sql` en Supabase.

## Pasos para Aplicar

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega este SQL:

```sql
-- Eliminar política si existe (para evitar errores en re-ejecución)
DROP POLICY IF EXISTS "Public can view active approved professional applications" ON public.professional_applications;

-- Crear política para acceso público (anon) a profesionales aprobados y activos
CREATE POLICY "Public can view active approved professional applications"
ON public.professional_applications
FOR SELECT
TO anon
USING (
  status = 'approved' 
  AND is_active = true
);
```

5. Click en **Run** o presiona `Ctrl/Cmd + Enter`
6. Verifica que se ejecutó exitosamente (deberías ver "Success. No rows returned")

### Opción 2: Copiar del Archivo

Simplemente copia y pega todo el contenido del archivo `147_add_public_access_to_professional_applications.sql` en el SQL Editor de Supabase y ejecútalo.

## Verificación

Después de aplicar la migración, verifica que la política se creó correctamente:

```sql
-- Ejecuta esto en el SQL Editor de Supabase
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'professional_applications'
  AND policyname = 'Public can view active approved professional applications';
```

Deberías ver una política con `roles = '{anon}'` y `cmd = 'SELECT'`.

## Resultado Esperado

Después de aplicar esta migración:
- ✅ Las páginas `/specialties/[slug]` serán accesibles sin autenticación
- ✅ Los usuarios anónimos podrán ver profesionales aprobados y activos
- ✅ Las especialidades funcionarán correctamente desde la homepage

## Nota de Seguridad

Esta política solo permite **lectura** (SELECT) de profesionales que:
- Tienen `status = 'approved'`
- Tienen `is_active = true`

No permite modificar, eliminar o crear registros. Es completamente segura para acceso público.
