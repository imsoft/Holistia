# ⚠️ IMPORTANTE: Ejecutar Migración de Storage para Servicios

## Problema

Al intentar subir imágenes de servicios, aparece este error:
```json
{
  "statusCode": "403",
  "error": "Unauthorized",
  "message": "new row violates row-level security policy"
}
```

## Solución

Debes ejecutar la migración `112_setup_professional_services_storage.sql` en Supabase.

---

## Pasos para Configurar el Storage

### Paso 1: Crear el Bucket

1. **Ir a Supabase Dashboard**:
   - Ve a [https://app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto Holistia

2. **Ir a Storage**:
   - En el menú lateral, haz clic en **"Storage"**
   - Haz clic en **"New bucket"**

3. **Configurar el Bucket**:
   - **Name**: `professional-services`
   - **Public bucket**: ✅ Marcado (checked)
   - Haz clic en **"Create bucket"**

### Paso 2: Configurar Políticas RLS

1. **Abrir Políticas del Bucket**:
   - En la lista de buckets, haz clic en `professional-services`
   - Ve a la pestaña **"Policies"**
   - Haz clic en **"New policy"**

2. **Crear Política de Lectura Pública**:
   - Haz clic en **"Create a policy from scratch"**
   - **Policy name**: `Public can view service images`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
   ```sql
   bucket_id = 'professional-services'
   ```
   - Haz clic en **"Review"** → **"Save policy"**

3. **Crear Política de Subida**:
   - Haz clic en **"New policy"** nuevamente
   - **Policy name**: `Professionals can upload their service images`
   - **Allowed operation**: `INSERT`
   - **WITH CHECK expression**:
   ```sql
   bucket_id = 'professional-services' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   - Haz clic en **"Review"** → **"Save policy"**

4. **Crear Política de Actualización**:
   - Haz clic en **"New policy"**
   - **Policy name**: `Professionals can update their service images`
   - **Allowed operation**: `UPDATE`
   - **USING expression**:
   ```sql
   bucket_id = 'professional-services' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   - **WITH CHECK expression**: (la misma)
   ```sql
   bucket_id = 'professional-services' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   - Haz clic en **"Review"** → **"Save policy"**

5. **Crear Política de Eliminación**:
   - Haz clic en **"New policy"**
   - **Policy name**: `Professionals can delete their service images`
   - **Allowed operation**: `DELETE`
   - **USING expression**:
   ```sql
   bucket_id = 'professional-services' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   - Haz clic en **"Review"** → **"Save policy"**

---

## ¿Qué hace esta migración?

La migración crea y configura:

1. **Bucket de storage** `professional-services`
   - Para almacenar imágenes de servicios

2. **Políticas RLS**:
   - ✅ Lectura pública (cualquiera puede ver las imágenes)
   - ✅ Subida por profesionales (solo el dueño puede subir)
   - ✅ Actualización por profesionales (solo el dueño puede actualizar)
   - ✅ Eliminación por profesionales (solo el dueño puede eliminar)

3. **Estructura de carpetas**:
   - `[user_id]/services/service-[id]-[timestamp].[ext]`

---

## Después de Ejecutar la Migración

1. **Refresca tu página** en Holistia
2. **Intenta subir la imagen nuevamente**
3. **Debería funcionar sin errores**

---

## ¿Problemas?

Si después de ejecutar la migración sigues teniendo problemas:

1. **Verifica que el bucket existe**:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'professional-services';
   ```

2. **Verifica las políticas**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' 
     AND tablename = 'objects' 
     AND policyname LIKE '%service%';
   ```

3. **Contacta a soporte**: hola@holistia.io

---

## Nota Importante

Esta migración es **idempotente**, es decir, puedes ejecutarla múltiples veces sin problemas. Si el bucket ya existe, simplemente no lo volverá a crear.

