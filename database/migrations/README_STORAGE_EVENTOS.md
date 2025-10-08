# Migraciones de Storage para Eventos

## Archivos de migración para solucionar problemas de storage de eventos:

### `30_fix_storage_eventos.sql`
**Archivo principal para ejecutar manualmente**
- Actualiza el usuario admin con `type: 'admin'`
- Crea el bucket `event-gallery`
- Verifica que todo se creó correctamente

### `31_solucion_completa_eventos.sql`
**Solución completa con tabla events_workshops**
- Incluye creación de tabla completa de eventos
- Configuración de RLS para tabla y storage
- Migración completa del sistema de eventos

### `32_solucion_directa_eventos.sql`
**Versión simplificada**
- Solo las políticas básicas de storage
- Para casos donde solo se necesita storage

### `33_solucion_final_eventos.sql`
**Versión que maneja políticas existentes**
- Elimina políticas existentes antes de crear nuevas
- Previene errores de "policy already exists"
- Incluye verificaciones completas

### `34_solucion_storage_eventos.sql`
**Solo configuración de storage**
- Enfocado únicamente en bucket y políticas de storage
- Sin creación de tablas

## Instrucciones de uso:

1. **Para solucionar el error 403 de storage:**
   - Ejecutar `30_fix_storage_eventos.sql` en Supabase SQL Editor
   - Cerrar sesión y volver a iniciar sesión
   - Probar subida de imágenes

2. **Para migración completa de eventos:**
   - Ejecutar `31_solucion_completa_eventos.sql` en Supabase SQL Editor
   - Incluye tabla, RLS y storage completo

3. **Si hay errores de políticas existentes:**
   - Usar `33_solucion_final_eventos.sql`
   - Maneja conflictos automáticamente
