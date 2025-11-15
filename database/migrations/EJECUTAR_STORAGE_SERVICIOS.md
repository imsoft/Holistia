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

## Pasos para Ejecutar la Migración

### Opción 1: Supabase Dashboard (Recomendado)

1. **Ir a Supabase Dashboard**:
   - Ve a [https://app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto Holistia

2. **Abrir SQL Editor**:
   - En el menú lateral, haz clic en **"SQL Editor"**
   - Haz clic en **"New Query"**

3. **Copiar y Pegar**:
   - Abre el archivo: `database/migrations/112_setup_professional_services_storage.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor

4. **Ejecutar**:
   - Haz clic en **"Run"** (▶️) o presiona `Cmd/Ctrl + Enter`
   - Espera a que termine (debería tomar 1-2 segundos)

5. **Verificar**:
   - Deberías ver mensajes de éxito
   - Si ya existe el bucket, verás mensajes como "ON CONFLICT DO NOTHING" (está bien)

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

