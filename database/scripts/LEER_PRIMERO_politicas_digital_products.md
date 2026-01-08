# ⚠️ IMPORTANTE: Crear Políticas de Storage para digital-products

## ❌ NO EJECUTAR COMO SQL

Este archivo contiene las expresiones SQL para las políticas de storage que **DEBEN crearse manualmente desde el Dashboard de Supabase**, NO desde el SQL Editor.

## 📋 Pasos para Crear las Políticas

1. Ve al **Supabase Dashboard** → **Storage** → **Policies**
2. Selecciona el bucket **`digital-products`**
3. Haz clic en **"New Policy"**
4. Para cada política, copia SOLO la expresión SQL del campo correspondiente (USING o WITH CHECK)

---

## 🔐 Política 1: Public can view digital-products files

**Operación:** SELECT  
**Roles:** public  
**Target roles:** public

**USING expression:**
```sql
bucket_id = 'digital-products'
```

---

## 🔐 Política 2: Authenticated users can upload to digital-products

**Operación:** INSERT  
**Roles:** authenticated  
**Target roles:** authenticated

**WITH CHECK expression:**
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

---

## 🔐 Política 3: Professionals can update their own digital-products files

**Operación:** UPDATE  
**Roles:** authenticated  
**Target roles:** authenticated

**USING expression:**
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

**WITH CHECK expression:**
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

---

## 🔐 Política 4: Professionals can delete their own digital-products files

**Operación:** DELETE  
**Roles:** authenticated  
**Target roles:** authenticated

**USING expression:**
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

---

## 🔐 Política 5: Admins can manage digital-products files

**Operación:** ALL (SELECT, INSERT, UPDATE, DELETE)  
**Roles:** authenticated  
**Target roles:** authenticated

**USING expression:**
```sql
bucket_id = 'digital-products'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

**WITH CHECK expression:**
```sql
bucket_id = 'digital-products'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

---

## ✅ Verificación

Después de crear todas las políticas, verifica que funcionan:

1. Intenta crear un nuevo producto digital
2. Intenta subir una imagen de portada
3. Verifica que no aparezca el error "Bucket not found"

---

## 📝 Notas

- La política de INSERT permite que profesionales aprobados suban archivos sin necesidad de que el producto exista previamente
- Esto permite el flujo: subir imagen primero, luego crear el producto
- Los admins pueden gestionar todos los archivos del bucket
