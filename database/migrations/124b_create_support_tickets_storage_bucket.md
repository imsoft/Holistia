# Configuración del Bucket de Storage para Tickets de Soporte

## Pasos para crear el bucket en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Haz clic en **Create a new bucket**

### Configuración del Bucket

- **Name**: `support-tickets`
- **Public bucket**: ✅ Activado (para permitir acceso público a los archivos adjuntos)
- **File size limit**: 52428800 bytes (50 MB)
- **Allowed MIME types**: Dejar vacío o configurar:
  - `image/*`
  - `video/*`

## Políticas de Seguridad (RLS)

Después de crear el bucket, configura las siguientes políticas:

### 1. Política para subir archivos

```sql
-- Los usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-tickets' AND
  (storage.foldername(name))[1] = 'ticket-attachments'
);
```

### 2. Política para ver archivos

```sql
-- Cualquiera puede ver los archivos (bucket público)
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support-tickets');
```

### 3. Política para eliminar archivos

```sql
-- Solo admins pueden eliminar archivos
CREATE POLICY "Only admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'support-tickets' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE type = 'admin'
  )
);
```

## Estructura de Carpetas

Los archivos se organizarán de la siguiente manera:

```
support-tickets/
└── ticket-attachments/
    └── {ticket_id}/
        └── {timestamp}-{random}.{ext}
```

Ejemplo:
```
support-tickets/
└── ticket-attachments/
    └── 123e4567-e89b-12d3-a456-426614174000/
        ├── 1704067200000-abc123.jpg
        ├── 1704067201000-def456.mp4
        └── 1704067202000-ghi789.png
```

## Verificación

Para verificar que el bucket está configurado correctamente:

1. Intenta crear un nuevo ticket con archivos adjuntos
2. Verifica que los archivos se suban correctamente
3. Comprueba que se puedan visualizar en el detalle del ticket
4. Asegúrate de que las URLs públicas funcionen

## Notas Importantes

- El tamaño máximo por archivo es de 50 MB
- Solo se permiten imágenes y videos
- Los archivos se almacenan con nombres únicos para evitar conflictos
- Los archivos se organizan por ticket para facilitar la administración
