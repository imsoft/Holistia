# 🔧 ACTUALIZAR Política de INSERT para digital-products (VERSIÓN CORREGIDA)

## ⚠️ PROBLEMA ACTUAL

La política `"Authenticated users can upload to digital-products"` **NO incluye la verificación de admin**, por lo que los admins no pueden subir imágenes.

## 📋 Pasos para Corregir

### 1. Ir al Dashboard de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** → **Policies**
3. Selecciona el bucket **`digital-products`**

### 2. Encontrar y Editar la Política

1. Busca la política llamada: **`Authenticated users can upload to digital-products`**
2. Haz clic en el botón de editar (✏️) o en los tres puntos (⋯) → **Edit**

### 3. Actualizar la Expresión WITH CHECK

**IMPORTANTE:** Copia EXACTAMENTE esta expresión (sin espacios extra, sin saltos de línea innecesarios):

```sql
bucket_id = 'digital-products' AND ((storage.foldername(name))[1] IN (SELECT id::text FROM digital_products WHERE EXISTS (SELECT 1 FROM professional_applications WHERE professional_applications.id = digital_products.professional_id AND professional_applications.user_id = auth.uid()))) OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.type = 'admin' AND profiles.account_active = true)
```

**O si el Dashboard requiere formato más legible, usa esta versión con saltos de línea:**

```sql
bucket_id = 'digital-products' 
AND (
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM digital_products 
    WHERE EXISTS (
      SELECT 1 
      FROM professional_applications 
      WHERE professional_applications.id = digital_products.professional_id 
      AND professional_applications.user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin' 
    AND profiles.account_active = true
  )
)
```

### 4. Alternativa: Eliminar y Recrear la Política

Si el editor sigue dando errores, es mejor **eliminar la política actual y crear una nueva**:

#### Paso 1: Eliminar la Política Actual

1. En la lista de políticas, encuentra `"Authenticated users can upload to digital-products"`
2. Haz clic en el botón de eliminar (🗑️)
3. Confirma la eliminación

#### Paso 2: Crear Nueva Política

1. Haz clic en **"New Policy"**
2. Selecciona **"For full customization"** o **"Custom policy"**
3. Configuración:
   - **Policy name:** `Authenticated users can upload to digital-products`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **USING expression:** (dejar completamente vacío)
   - **WITH CHECK expression:** (pegar una de las expresiones de arriba)

4. Haz clic en **"Review"** y luego **"Save policy"**

---

## ✅ Verificación

Después de actualizar, ejecuta este script para verificar:

```sql
SELECT 
  policyname,
  cmd,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname = 'Authenticated users can upload to digital-products'
  AND cmd = 'INSERT';
```

La expresión `with_check_expression` debe incluir la parte de `OR EXISTS (SELECT 1 FROM public.profiles...)` para admins.

---

## 🔍 Solución de Problemas

### Error: "syntax error at end of input"

Este error generalmente ocurre cuando:
1. Hay espacios o caracteres invisibles al final de la expresión
2. Falta un paréntesis de cierre
3. El Dashboard no acepta ciertos formatos

**Solución:** Usa la versión de una sola línea (primera opción) o elimina y recrea la política.

### Error: "column does not exist"

Asegúrate de que:
- `bucket_id` está escrito correctamente (no `bucket_name`)
- `auth.uid()` tiene los paréntesis
- `storage.foldername(name)` está escrito correctamente

---

## 📝 Nota Importante

La política actual permite subir archivos solo si:
- El archivo pertenece a un producto que ya existe Y
- El producto pertenece al profesional autenticado

Pero **falta** la condición para admins. Al agregar la parte de `OR EXISTS (SELECT 1 FROM public.profiles...)`, los admins también podrán subir archivos.
