-- =====================================================
-- MIGRACIÓN: Actualizar bucket para soportar licencias y servicios
-- =====================================================
-- Actualiza el bucket holistic-centers para permitir
-- archivos PDF y más tipos de archivos para licencias
-- =====================================================

-- 1. Actualizar configuración del bucket para permitir PDFs
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  file_size_limit = 10485760 -- 10MB (aumentado para PDFs)
WHERE id = 'holistic-centers';

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO ACTUALIZADA:
-- =====================================================
-- Imagen principal del centro:
-- holistic-centers/<center-id>/imagen.{ext}
--
-- Licencias (PDFs o imágenes):
-- holistic-centers/<center-id>/licenses/<license-id>.{ext}
--
-- Servicios (hasta 4 imágenes por servicio):
-- holistic-centers/<center-id>/services/<service-name>/image-0.{ext}
-- holistic-centers/<center-id>/services/<service-name>/image-1.{ext}
-- holistic-centers/<center-id>/services/<service-name>/image-2.{ext}
-- holistic-centers/<center-id>/services/<service-name>/image-3.{ext}
--
-- Ejemplo completo:
-- holistic-centers/abc-123-def/imagen.jpg
-- holistic-centers/abc-123-def/licenses/lic-001.pdf
-- holistic-centers/abc-123-def/services/yoga-terapeutico/image-0.jpg
-- =====================================================
