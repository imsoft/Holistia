
# Configuración de Buckets de Storage para Restaurantes y Centros Holísticos

## Resumen
Se ha implementado el sistema de subida de imágenes para restaurantes y centros holísticos usando Supabase Storage.

## Buckets necesarios
Los buckets se crean automáticamente al ejecutar la migración `102_create_storage_buckets.sql`.

### Buckets:
1. **restaurants** - Para imágenes de restaurantes
2. **holistic-centers** - Para imágenes de centros holísticos

### Estructura de almacenamiento:
- Restaurantes: `restaurants/<restaurant-id>/imagen.{ext}`
- Centros: `holistic-centers/<center-id>/imagen.{ext}`

## Verificar buckets en Supabase
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Navega a **Storage** en el menú lateral
3. Verifica que existan los buckets `restaurants` y `holistic-centers`
4. Si no existen, ejecuta la migración `database/migrations/102_create_storage_buckets.sql` en el SQL Editor

## Componentes creados
- `src/components/ui/restaurant-center-image-uploader.tsx` - Componente reutilizable para subir imágenes

## Páginas actualizadas
- `src/app/(dashboard)/(admin)/admin/[id]/restaurants/page.tsx`
- `src/app/(dashboard)/(admin)/admin/[id]/holistic-centers/page.tsx`

## Características
- ✅ Subida de imágenes por drag & drop o selección de archivo
- ✅ Vista previa antes de subir
- ✅ Validación de tipo de archivo (solo imágenes)
- ✅ Validación de tamaño (máximo 5MB)
- ✅ Actualización automática en la base de datos al subir/eliminar
- ✅ Estructura de carpetas: /<id>/imagen.{ext}
- ✅ Eliminación de imágenes del storage al remover


