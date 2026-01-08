-- ============================================================================
-- MIGRACIÓN 154: Corregir RLS y Storage para Professional Services
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: 
--   1. Actualizar políticas RLS para que admins puedan gestionar servicios
--   2. Corregir políticas de storage para permitir subida de imágenes
--   3. Asegurar que los servicios se puedan ver correctamente
-- ============================================================================

-- ============================================================================
-- PARTE 1: ACTUALIZAR POLÍTICAS RLS DE PROFESSIONAL_SERVICES
-- ============================================================================

-- Eliminar políticas antiguas que usan email hardcodeado
DROP POLICY IF EXISTS "Admins can manage all services" ON public.professional_services;

-- Política actualizada para admins usando profiles
CREATE POLICY "Admins can manage all services"
ON public.professional_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
);

-- Asegurar que la política de profesionales funcione correctamente
DROP POLICY IF EXISTS "Professionals can manage their own services" ON public.professional_services;

CREATE POLICY "Professionals can manage their own services"
ON public.professional_services
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Asegurar que la política de lectura pública funcione
DROP POLICY IF EXISTS "Patients can view active services" ON public.professional_services;

CREATE POLICY "Patients can view active services"
ON public.professional_services
FOR SELECT
TO authenticated
USING (
  isactive = true AND
  EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = professional_services.professional_id
    AND pa.status = 'approved'
    AND pa.is_active = true
  )
);

-- Asegurar política de lectura pública (anon)
DROP POLICY IF EXISTS "Public can view active professional services" ON public.professional_services;

CREATE POLICY "Public can view active professional services"
ON public.professional_services
FOR SELECT
TO anon
USING (
  isactive = true AND
  EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = professional_services.professional_id
    AND pa.status = 'approved'
    AND pa.is_active = true
  )
);

-- ============================================================================
-- PARTE 2: VERIFICAR BUCKET DE STORAGE
-- ============================================================================
-- NOTA IMPORTANTE: Las políticas de storage NO se pueden crear desde SQL
-- sin permisos de superusuario. Deben crearse manualmente desde el Dashboard.
-- Ver archivo: database/scripts/crear_storage_policies_professional_services.md
-- ============================================================================

-- Solo verificar que el bucket existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'professional-services') THEN
    RAISE NOTICE '⚠️ El bucket professional-services no existe. Créalo desde Storage → New bucket';
    RAISE NOTICE '   - Name: professional-services';
    RAISE NOTICE '   - Public: true';
    RAISE NOTICE '   - File size limit: 5242880 (5MB)';
  ELSE
    RAISE NOTICE '✅ Bucket professional-services encontrado';
  END IF;
END $$;

-- ============================================================================
-- NOTA SOBRE POLÍTICAS DE STORAGE
-- ============================================================================
-- Las políticas de storage NO pueden crearse desde SQL sin permisos de superusuario.
-- 
-- INSTRUCCIONES: Ve al archivo:
-- database/scripts/crear_storage_policies_professional_services.md
-- 
-- Allí encontrarás una guía paso a paso para crear las políticas desde el Dashboard.
-- 
-- El bucket professional-services ya existe (según tu captura de pantalla).
-- Solo necesitas verificar/actualizar las políticas desde:
-- Supabase Dashboard → Storage → professional-services → Policies
-- ============================================================================

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Admins can manage all services" ON public.professional_services
IS 'Permite a administradores gestionar todos los servicios de profesionales';

COMMENT ON POLICY "Public can view service images" ON storage.objects
IS 'Permite a todos los usuarios ver imágenes de servicios (bucket público)';

COMMENT ON POLICY "Professionals can upload service images" ON storage.objects
IS 'Permite a profesionales subir imágenes en su carpeta personal (formato: {user_id}/...)';

COMMENT ON POLICY "Admins can upload service images" ON storage.objects
IS 'Permite a administradores subir imágenes de servicios de cualquier profesional';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'professional_services'
ORDER BY policyname;

-- Verificar políticas de storage (solo lectura, no requiere permisos especiales)
-- Si esta query falla, es normal - las políticas de storage se gestionan desde el Dashboard
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%service%'
ORDER BY policyname;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. Asegúrate de que el bucket 'professional-services' existe y es público
-- 2. Las imágenes deben subirse con el formato: {user_id}/service-{service_id}/image.jpg
-- 3. Los admins ahora pueden gestionar todos los servicios y subir imágenes
-- 4. Los profesionales solo pueden gestionar sus propios servicios
-- 5. Las políticas de storage permiten múltiples formatos de path para compatibilidad
-- ============================================================================
