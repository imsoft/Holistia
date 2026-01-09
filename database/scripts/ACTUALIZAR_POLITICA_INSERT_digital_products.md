# 🔧 ACTUALIZAR Política de INSERT para digital-products

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

**Reemplaza** la expresión `WITH CHECK` actual con esta:

```sql
bucket_id = 'digital-products'
AND (
  -- Permitir si el archivo pertenece a un producto del profesional
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM digital_products
    WHERE EXISTS (
      SELECT 1 FROM professional_applications
      WHERE professional_applications.id = digital_products.professional_id
      AND professional_applications.user_id = auth.uid()
    )
  )
  -- O si es admin activo (ESTA PARTE FALTA EN LA POLÍTICA ACTUAL)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
)
```

### 4. Guardar los Cambios

1. Haz clic en **"Review"** o **"Save policy"**
2. Confirma los cambios

---

## ✅ Verificación

Después de actualizar, ejecuta este script para verificar:

```sql
-- Verificar la expresión WITH CHECK de la política
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

## 🔍 Si la Política no Existe

Si no encuentras la política, créala desde cero:

1. Haz clic en **"New Policy"**
2. Configuración:
   - **Policy name:** `Authenticated users can upload to digital-products`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **USING expression:** (dejar vacío)
   - **WITH CHECK expression:** (usar la expresión completa de arriba)
3. Guardar

---

## 📝 Nota Importante

La política actual permite subir archivos solo si:
- El archivo pertenece a un producto que ya existe Y
- El producto pertenece al profesional autenticado

Pero **falta** la condición para admins. Al agregar la parte de `OR EXISTS (SELECT 1 FROM public.profiles...)`, los admins también podrán subir archivos.
