# 🔧 Instrucciones Manuales: Políticas de Storage para digital-products

## ⚠️ IMPORTANTE

Si al ejecutar la migración 160 obtienes el error:
```
ERROR: must be owner of relation objects
```

Entonces necesitas crear las políticas **manualmente desde el Dashboard de Supabase**.

---

## 📋 Pasos para Crear las Políticas Manualmente

### 1. Ir al Dashboard de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** → **Policies**
3. Selecciona el bucket **`digital-products`**

### 2. Eliminar Políticas Existentes (si las hay)

1. Busca todas las políticas que contengan "digital-products" en el nombre
2. Haz clic en el botón de eliminar (🗑️) de cada una
3. Confirma la eliminación

### 3. Crear Política 1: Public can view digital-products files

1. Haz clic en **"New Policy"**
2. Configuración:
   - **Policy name:** `Public can view digital-products files`
   - **Allowed operation:** `SELECT`
   - **Target roles:** `public`
   - **USING expression:**
     ```sql
     bucket_id = 'digital-products'
     ```
   - **WITH CHECK expression:** (dejar vacío)
3. Haz clic en **"Review"** y luego **"Save policy"**

### 4. Crear Política 2: Authenticated users can upload to digital-products

1. Haz clic en **"New Policy"**
2. Configuración:
   - **Policy name:** `Authenticated users can upload to digital-products`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **USING expression:** (dejar vacío)
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'digital-products'
     AND (
       EXISTS (
         SELECT 1 FROM public.professional_applications
         WHERE professional_applications.user_id = auth.uid()
         AND professional_applications.status = 'approved'
       )
       OR EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.id = auth.uid()
         AND profiles.type = 'admin'
         AND profiles.account_active = true
       )
     )
     ```
3. Haz clic en **"Review"** y luego **"Save policy"**

### 5. Crear Política 3: Professionals can update their own digital-products files

1. Haz clic en **"New Policy"**
2. Configuración:
   - **Policy name:** `Professionals can update their own digital-products files`
   - **Allowed operation:** `UPDATE`
   - **Target roles:** `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'digital-products'
     AND (
       (storage.foldername(name))[1] IN (
         SELECT id::text FROM digital_products
         WHERE EXISTS (
           SELECT 1 FROM professional_applications
           WHERE professional_applications.id = digital_products.professional_id
           AND professional_applications.user_id = auth.uid()
         )
       )
       OR EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.id = auth.uid()
         AND profiles.type = 'admin'
         AND profiles.account_active = true
       )
     )
     ```
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'digital-products'
     AND (
       (storage.foldername(name))[1] IN (
         SELECT id::text FROM digital_products
         WHERE EXISTS (
           SELECT 1 FROM professional_applications
           WHERE professional_applications.id = digital_products.professional_id
           AND professional_applications.user_id = auth.uid()
         )
       )
       OR EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.id = auth.uid()
         AND profiles.type = 'admin'
         AND profiles.account_active = true
       )
     )
     ```
3. Haz clic en **"Review"** y luego **"Save policy"**

### 6. Crear Política 4: Professionals can delete their own digital-products files

1. Haz clic en **"New Policy"**
2. Configuración:
   - **Policy name:** `Professionals can delete their own digital-products files`
   - **Allowed operation:** `DELETE`
   - **Target roles:** `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'digital-products'
     AND (
       (storage.foldername(name))[1] IN (
         SELECT id::text FROM digital_products
         WHERE EXISTS (
           SELECT 1 FROM professional_applications
           WHERE professional_applications.id = digital_products.professional_id
           AND professional_applications.user_id = auth.uid()
         )
       )
       OR EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.id = auth.uid()
         AND profiles.type = 'admin'
         AND profiles.account_active = true
       )
     )
     ```
   - **WITH CHECK expression:** (dejar vacío)
3. Haz clic en **"Review"** y luego **"Save policy"**

### 7. Crear Política 5: Admins can manage digital-products files (POLÍTICA ADICIONAL)

1. Haz clic en **"New Policy"**
2. Configuración:
   - **Policy name:** `Admins can manage digital-products files`
   - **Allowed operation:** `ALL` (o selecciona todas: SELECT, INSERT, UPDATE, DELETE)
   - **Target roles:** `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'digital-products'
     AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE profiles.id = auth.uid()
       AND profiles.type = 'admin'
       AND profiles.account_active = true
     )
     ```
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'digital-products'
     AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE profiles.id = auth.uid()
       AND profiles.type = 'admin'
       AND profiles.account_active = true
     )
     ```
3. Haz clic en **"Review"** y luego **"Save policy"**

---

## ✅ Verificación

Después de crear todas las políticas, ejecuta el script de verificación:

```sql
-- Ejecutar en Supabase SQL Editor
\i database/scripts/verificar_politicas_storage_digital_products.sql
```

O copia y pega el contenido del archivo `verificar_politicas_storage_digital_products.sql` en el SQL Editor.

---

## 🔍 Solución de Problemas

### Error: "new row violates row-level security policy"

1. Verifica que el admin tenga `account_active = true`:
   ```sql
   SELECT id, type, account_active 
   FROM public.profiles 
   WHERE id = auth.uid();
   ```

2. Verifica que las políticas se crearon correctamente ejecutando el script de verificación

3. Si el admin tiene `account_active = false`, actualízalo:
   ```sql
   UPDATE public.profiles 
   SET account_active = true 
   WHERE id = 'TU_ADMIN_ID' AND type = 'admin';
   ```

### Error: "must be owner of relation objects"

Este error significa que no tienes permisos de superusuario. En este caso, **DEBES crear las políticas manualmente desde el Dashboard** siguiendo los pasos anteriores.

---

## 📝 Notas

- La política 5 (`Admins can manage digital-products files`) es una política adicional de seguridad que asegura que los admins tengan acceso completo incluso si hay conflictos con otras políticas.
- Todas las políticas verifican que el admin tenga `account_active = true` para mayor seguridad.
- Las políticas permiten que los profesionales aprobados también puedan subir archivos, pero solo a sus propios productos.
