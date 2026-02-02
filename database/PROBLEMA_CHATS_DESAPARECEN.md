# Problema: Los chats desaparecen en /messages

## 🔍 Diagnóstico del problema

### Causa raíz
Las conversaciones en la tabla `direct_conversations` tienen configurado `ON DELETE CASCADE` para las foreign keys:
- `user_id` → `auth.users(id) ON DELETE CASCADE`
- `professional_id` → `professional_applications(id) ON DELETE CASCADE`

Esto significa que **cuando un usuario o profesional es eliminado o desactivado, todas sus conversaciones se eliminan automáticamente** de la base de datos.

### Escenarios que causan la desaparición de chats

1. **Profesional desactivado**: Si un admin desactiva la cuenta de un profesional o cambia su estado en `professional_applications`, todas sus conversaciones se eliminan.

2. **Usuario eliminado**: Si un usuario elimina su cuenta, todas sus conversaciones desaparecen.

3. **Cambio de estado del profesional**: Si el profesional cambia de `status = 'approved'` a otro estado, las políticas RLS ocultan las conversaciones (aunque no las eliminan físicamente).

## ✅ Solución implementada

Se ha creado la migración `213_fix_direct_conversations_cascade_deletion.sql` que:

### 1. Cambia el comportamiento de eliminación
- **Antes**: `ON DELETE CASCADE` (elimina conversaciones)
- **Después**: `ON DELETE SET NULL` (mantiene conversaciones, marca campos como NULL)

### 2. Agrega campos de control
- `user_deleted`: Indica si el usuario fue eliminado
- `professional_deleted`: Indica si el profesional fue eliminado
- `archived`: Marca la conversación como archivada automáticamente

### 3. Actualiza políticas RLS
- Las conversaciones archivadas no se muestran en la interfaz
- Los usuarios solo ven conversaciones activas (no archivadas)
- Los profesionales solo ven conversaciones donde están aprobados

### 4. Trigger automático
Cuando `user_id` o `professional_id` se vuelven NULL (por eliminación), el trigger:
- Marca el campo correspondiente (`user_deleted` o `professional_deleted`) como `true`
- Marca `archived = true`
- La conversación se oculta pero **no se elimina**

## 📋 Cómo aplicar la solución

### Paso 1: Ejecutar la migración en Supabase

1. Ve al **Dashboard de Supabase**
2. Navega a **SQL Editor**
3. Copia y pega el contenido completo del archivo:
   ```
   database/migrations/213_fix_direct_conversations_cascade_deletion.sql
   ```
4. Ejecuta la migración

### Paso 2: Verificar que se aplicó correctamente

Ejecuta esta query para verificar:

```sql
-- Verificar que los campos nuevos existen
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'direct_conversations'
AND column_name IN ('user_deleted', 'professional_deleted', 'archived', 'user_id', 'professional_id')
ORDER BY column_name;

-- Debería mostrar:
-- archived             | boolean | NO
-- professional_deleted | boolean | NO
-- professional_id      | uuid    | YES  (ahora permite NULL)
-- user_deleted         | boolean | NO
-- user_id              | uuid    | YES  (ahora permite NULL)
```

### Paso 3: Verificar las políticas RLS

```sql
-- Ver las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'direct_conversations'
ORDER BY policyname;
```

## 🔄 Recuperación de conversaciones perdidas

**Importante**: Esta migración **NO puede recuperar** conversaciones que ya fueron eliminadas por el CASCADE anterior. Solo previene futuras eliminaciones.

Si necesitas recuperar conversaciones perdidas:

1. **Opción 1: Restaurar desde backup**
   - Si tienes un backup de Supabase, restaura las tablas `direct_conversations` y `direct_messages`

2. **Opción 2: Recrear conversaciones**
   - Los usuarios tendrán que iniciar nuevas conversaciones con los profesionales
   - Los mensajes anteriores se perdieron permanentemente

## 🛡️ Prevención futura

Con esta migración aplicada:

✅ Las conversaciones **NO se eliminan** cuando un usuario/profesional es desactivado
✅ Las conversaciones se **archivan automáticamente** pero permanecen en la base de datos
✅ Los usuarios no ven conversaciones archivadas en la interfaz
✅ Los administradores pueden consultar conversaciones archivadas si es necesario

## 📊 Monitoreo

Para ver conversaciones archivadas (solo admins):

```sql
-- Ver todas las conversaciones archivadas
SELECT 
    id,
    user_id,
    professional_id,
    user_deleted,
    professional_deleted,
    archived,
    last_message_at,
    created_at
FROM public.direct_conversations
WHERE archived = true
ORDER BY last_message_at DESC;
```

## ⚠️ Notas importantes

1. **Ejecutar en producción**: Esta migración es segura y no elimina datos existentes.
2. **Conversaciones actuales**: Las conversaciones existentes seguirán funcionando normalmente.
3. **Backup recomendado**: Aunque es segura, siempre es buena práctica hacer un backup antes de ejecutar migraciones en producción.
4. **Sin downtime**: La migración se ejecuta sin afectar el funcionamiento actual de la aplicación.

## 🔗 Archivos relacionados

- Migración: `database/migrations/213_fix_direct_conversations_cascade_deletion.sql`
- Sistema original: `database/migrations/169_create_direct_messaging_system.sql`
- API conversaciones: `src/app/api/messages/conversations/route.ts`
- Página mensajes: `src/app/(dashboard)/messages/page.tsx`
