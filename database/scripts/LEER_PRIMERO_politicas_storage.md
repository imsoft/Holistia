# ⚠️ IMPORTANTE: Cómo Usar los Archivos de Políticas de Storage

## ❌ NO HAGAS ESTO:
- ❌ NO ejecutes `politicas_admin_storage_professional_services.sql` en el SQL Editor
- ❌ NO copies todo el archivo al SQL Editor
- ❌ NO intentes ejecutar las expresiones SQL directamente

## ✅ HAZ ESTO:

### Paso 1: Abre el archivo de referencia
Abre `politicas_admin_storage_professional_services.sql` para ver las expresiones SQL.

### Paso 2: Ve al Dashboard de Supabase
1. Ve a **Supabase Dashboard**
2. **Storage** → **professional-services** → **Policies**
3. Haz clic en **"New policy"**

### Paso 3: Crea cada política manualmente
Para cada una de las 3 políticas:

1. **Haz clic en "New policy"**
2. **Selecciona "Create a policy from scratch"**
3. **Completa los campos:**
   - Policy name: (el nombre indicado en el archivo)
   - Allowed operation: (INSERT, UPDATE o DELETE)
   - Target roles: `authenticated`
   - Expression: **Copia SOLO la expresión SQL** (sin los comentarios `--`)

### Paso 4: Copia SOLO la expresión SQL
Del archivo de referencia, copia SOLO la parte que está después de los comentarios, por ejemplo:

```sql
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

**NO copies los comentarios `--` ni las líneas de separación.**

## Ejemplo Visual

### ❌ INCORRECTO (esto causará error):
```sql
-- POLÍTICA 1: Admins can upload service images
-- Policy name: Admins can upload service images
bucket_id = 'professional-services'
```

### ✅ CORRECTO (copia solo esto):
```sql
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

## Resumen

- **Archivos SQL ejecutables**: Solo los que están en `database/migrations/`
- **Archivos de referencia**: Los que están en `database/scripts/` con expresiones SQL
- **Políticas de storage**: Se crean desde el Dashboard, NO desde SQL Editor
