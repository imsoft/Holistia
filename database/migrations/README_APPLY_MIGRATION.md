# Aplicar Migración de Acceso Público a Servicios

## Problema
Los servicios profesionales no son visibles en perfiles públicos porque las políticas RLS solo permiten acceso a usuarios autenticados.

## Solución
Ejecutar la migración `999_add_public_access_to_professional_services.sql` en Supabase.

## Pasos para aplicar

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega el contenido del archivo `999_add_public_access_to_professional_services.sql`
5. Click en **Run** o presiona `Ctrl/Cmd + Enter`
6. Verifica que se ejecutó exitosamente (deberías ver "Success. No rows returned")

### Opción 2: Desde CLI de Supabase

```bash
# Asegúrate de estar en el directorio del proyecto
cd /Users/brangarciaramos/Proyectos/holistia/web/Holistia

# Ejecuta la migración
supabase db push
```

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
WHERE tablename = 'professional_services'
ORDER BY policyname;
```

Deberías ver una política llamada "Public can view active professional services" con `roles = '{anon}'`.

## Resultado Esperado

Después de aplicar esta migración, los servicios profesionales serán visibles en:
- `https://www.holistia.io/public/professional/[slug]` (perfiles públicos)
- Cualquier vista pública donde se muestren servicios

**IMPORTANTE:** Solo se mostrarán servicios donde:
- `isactive = true`
- El profesional esté aprobado (`status = 'approved'`)
- El profesional esté activo (`is_active = true`)
