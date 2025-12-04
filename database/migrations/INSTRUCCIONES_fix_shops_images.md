# 🔧 Solución al Error 400 Bad Request en Imágenes de Shops

## 📋 Problema Identificado

Al acceder a la página `https://www.holistia.io/patient/247931aa-47bb-4b33-b43e-89b5485f2a72/explore`, las imágenes de las tarjetas de **Comercios (Shops)** no se cargan y aparece este error:

```
Error 400 Bad Request
URL: https://raylqjmjdlojgkggvenq.supabase.co/storage/v1/object/public/shops/28f4ae55-a2f2-4c58-b114-2486b3ee900c/imagen.PNG
```

## 🔍 Causa del Problema

El bucket `shops` en Supabase Storage tiene uno o más de estos problemas:

1. **Bucket no es público**: El bucket puede estar configurado como privado (`public = false`)
2. **Políticas incorrectas**: Las políticas de storage no permiten acceso público a las imágenes
3. **Extensión de archivo**: La extensión `.PNG` (mayúsculas) no está en la lista de tipos MIME permitidos

## ✅ Solución

### Paso 1: Ejecutar el Script de Corrección

1. Ve a tu panel de **Supabase**
2. Abre el **SQL Editor**
3. Ejecuta el archivo: [`EJECUTAR_fix_shops_storage_policies.sql`](./EJECUTAR_fix_shops_storage_policies.sql)

Este script hará lo siguiente:
- ✅ Verificará si el bucket `shops` existe
- ✅ Configurará el bucket como **público** (`public = true`)
- ✅ Agregará tipos MIME para extensiones en mayúsculas (`.PNG`, `.JPG`, `.JPEG`)
- ✅ Eliminará políticas antiguas que puedan causar conflictos
- ✅ Creará nuevas políticas correctas:
  - **Lectura pública**: TODOS pueden ver las imágenes (incluso usuarios no autenticados)
  - **Escritura autenticada**: Solo usuarios autenticados pueden subir/modificar/eliminar

### Paso 2: Verificar el Resultado

Después de ejecutar el script, verifica:

#### A. Verificar el Bucket
El script mostrará algo como:
```sql
✅ Bucket es PÚBLICO - Las imágenes deberían ser accesibles
```

#### B. Probar la URL Directamente
Copia la URL de la imagen que estaba dando error:
```
https://raylqjmjdlojgkggvenq.supabase.co/storage/v1/object/public/shops/28f4ae55-a2f2-4c58-b114-2486b3ee900c/imagen.PNG
```

Ábrela en una nueva pestaña del navegador:
- ✅ **Correcto**: Se ve la imagen
- ❌ **Error**: Aparece error 400 o 404

#### C. Verificar la Página de Explore
1. Ve a: `https://www.holistia.io/patient/247931aa-47bb-4b33-b43e-89b5485f2a72/explore`
2. Desplázate hasta la sección **"Comercios"**
3. Verifica que las tarjetas muestren sus imágenes correctamente

### Paso 3: Si el Problema Persiste

Si después de ejecutar el script las imágenes aún no se ven, verifica lo siguiente:

#### Opción A: Verificar Manualmente el Bucket en Supabase UI

1. Ve a **Supabase Dashboard** → **Storage**
2. Busca el bucket `shops`
3. Haz clic en **Settings (⚙️)**
4. Asegúrate de que:
   - ✅ **Public bucket** esté activado
   - ✅ **File size limit** sea al menos `5242880` (5MB)
   - ✅ **Allowed MIME types** incluya: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

#### Opción B: Recrear el Bucket (ÚLTIMA OPCIÓN)

⚠️ **ADVERTENCIA**: Esto eliminará todas las imágenes existentes.

```sql
-- 1. Eliminar el bucket existente
DELETE FROM storage.buckets WHERE id = 'shops';

-- 2. Crear el bucket nuevamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shops',
  'shops',
  true, -- IMPORTANTE: bucket público
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/PNG', 'image/JPG', 'image/JPEG']
);

-- 3. Ejecutar EJECUTAR_fix_shops_storage_policies.sql nuevamente
```

#### Opción C: Verificar que Next.js permite el dominio de Supabase

En [`next.config.ts`](../../next.config.ts), verifica que existe esta configuración:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'raylqjmjdlojgkggvenq.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
  ],
}
```

## 📊 Archivos Relevantes

| Archivo | Descripción |
|---------|-------------|
| [`EJECUTAR_fix_shops_storage_policies.sql`](./EJECUTAR_fix_shops_storage_policies.sql) | Script de corrección de políticas |
| [`114_create_shops_and_products.sql`](./114_create_shops_and_products.sql) | Migración original del bucket shops |
| [`122_allow_anon_users_to_view_shops.sql`](./122_allow_anon_users_to_view_shops.sql) | Políticas RLS para usuarios anónimos |
| [`src/app/(dashboard)/(patient)/patient/[id]/explore/page.tsx`](../../src/app/(dashboard)/(patient)/patient/[id]/explore/page.tsx#L836) | Página donde aparece el error |
| [`src/components/ui/stable-image.tsx`](../../src/components/ui/stable-image.tsx) | Componente que carga las imágenes |

## 🎯 Resultado Esperado

Después de aplicar la solución:

- ✅ Las imágenes de comercios se ven correctamente en `/patient/[id]/explore`
- ✅ Las tarjetas de comercios muestran sus imágenes sin error 400
- ✅ Las URLs públicas de Supabase Storage funcionan directamente en el navegador
- ✅ Los usuarios NO AUTENTICADOS pueden ver las imágenes públicas
- ✅ Los usuarios AUTENTICADOS pueden subir/modificar/eliminar imágenes

## 📝 Notas Técnicas

### ¿Por qué el bucket debe ser público?

En Supabase Storage hay dos niveles de seguridad:

1. **Nivel de Bucket** (`public` column en `storage.buckets`):
   - Si `public = true`: Las URLs `/storage/v1/object/public/...` funcionan
   - Si `public = false`: Solo se puede acceder vía URLs firmadas temporales

2. **Nivel de Políticas** (RLS en `storage.objects`):
   - Controlan quién puede SELECT, INSERT, UPDATE, DELETE archivos
   - Se aplican DESPUÉS del nivel de bucket

Para que las imágenes se vean en las tarjetas públicas, necesitamos:
- ✅ Bucket público (`public = true`)
- ✅ Política `TO public` para SELECT

### ¿Por qué agregar extensiones en mayúsculas?

Aunque el archivo se llame `imagen.PNG`, el navegador envía el MIME type según el contenido del archivo. Sin embargo, Supabase puede rechazar la subida si la extensión no coincide con los tipos permitidos.

Al agregar `'image/PNG'`, `'image/JPG'`, etc., aseguramos compatibilidad con archivos que tengan extensiones en mayúsculas.

---

**¿Necesitas ayuda?** Revisa los logs de la consola del navegador (F12 → Console) para ver errores más detallados.
