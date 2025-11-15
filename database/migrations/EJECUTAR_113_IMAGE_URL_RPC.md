# ⚠️ IMPORTANTE: Ejecutar Migración 113 para Incluir image_url en RPC

## Problema

La función RPC `get_professional_services` no estaba retornando el campo `image_url`, por lo que las imágenes de servicios no aparecían en el perfil público del profesional.

## Solución

Ejecutar la migración `113_add_image_url_to_get_professional_services.sql` que actualiza la función RPC para incluir `image_url` en su retorno.

---

## Pasos para Ejecutar

### Paso 1: Ir a Supabase Dashboard

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto **Holistia**

### Paso 2: Ejecutar la Migración

1. Ve a **SQL Editor** en el menú lateral
2. Haz clic en **"New query"**
3. Copia y pega el contenido completo del archivo:
   ```
   database/migrations/113_add_image_url_to_get_professional_services.sql
   ```
4. Haz clic en **"Run"** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### Paso 3: Verificar

Después de ejecutar, deberías ver un mensaje de éxito. La función ahora incluirá `image_url` en su retorno.

---

## ¿Qué hace esta migración?

- Actualiza la función `get_professional_services` para incluir `image_url` en la tabla de retorno
- Agrega `image_url` al SELECT de la función
- Mantiene toda la funcionalidad existente, solo agrega el campo faltante

---

## Después de Ejecutar

Una vez ejecutada la migración:
1. Las imágenes de servicios deberían aparecer correctamente
2. El error PGRST116 se manejará mejor (ya no aparecerá en la consola)
3. Los servicios con imágenes se mostrarán con su imagen correspondiente

---

**Nota**: Esta migración es **idempotente** - puedes ejecutarla múltiples veces sin problemas.

