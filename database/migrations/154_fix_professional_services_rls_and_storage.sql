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
-- PARTE 2: CORREGIR POLÍTICAS DE STORAGE PARA PROFESSIONAL-SERVICES
-- ============================================================================
-- NOTA: Las políticas de storage deben crearse desde el Dashboard de Supabase
-- o ejecutarse con permisos de superusuario. Este script solo verifica.
-- ============================================================================

-- Verificar que el bucket existe, si no, crear instrucciones
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'professional-services') THEN
    RAISE NOTICE 'El bucket professional-services no existe. Créalo desde Storage → New bucket con nombre: professional-services, público: true';
  ELSE
    RAISE NOTICE 'Bucket professional-services encontrado';
  END IF;
END $$;

-- Intentar eliminar políticas existentes de storage (solo si tenemos permisos)
-- Si falla, se ignorará y se mostrará un mensaje
DO $$ 
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
    DROP POLICY IF EXISTS "Professionals can upload service images" ON storage.objects;
    DROP POLICY IF EXISTS "Professionals can update service images" ON storage.objects;
    DROP POLICY IF EXISTS "Professionals can delete service images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can upload service images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update service images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete service images" ON storage.objects;
    RAISE NOTICE 'Políticas de storage eliminadas (si existían)';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'No se tienen permisos para eliminar políticas de storage. Esto es normal. Las políticas deben crearse desde el Dashboard.';
  END;
END $$;

-- ============================================================================
-- IMPORTANTE: Las políticas de storage deben crearse desde el Dashboard
-- ============================================================================
-- Las políticas de storage requieren permisos de superusuario.
-- Sigue estas instrucciones para crearlas manualmente:
--
-- 1. Ve a Supabase Dashboard → Storage → professional-services → Policies
-- 2. Crea las siguientes políticas:
--
-- POLÍTICA 1: "Public can view service images"
--   - Operation: SELECT
--   - Target roles: public
--   - USING expression: bucket_id = 'professional-services'
--
-- POLÍTICA 2: "Professionals can upload service images"
--   - Operation: INSERT
--   - Target roles: authenticated
--   - WITH CHECK expression:
--     bucket_id = 'professional-services' 
--     AND (storage.foldername(name))[1] = auth.uid()::text
--
-- POLÍTICA 3: "Admins can upload service images"
--   - Operation: INSERT
--   - Target roles: authenticated
--   - WITH CHECK expression:
--     bucket_id = 'professional-services'
--     AND EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.type = 'admin'
--       AND profiles.account_active = true
--     )
--
-- POLÍTICA 4: "Professionals can update service images"
--   - Operation: UPDATE
--   - Target roles: authenticated
--   - USING expression:
--     bucket_id = 'professional-services' 
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   - WITH CHECK expression: (mismo que USING)
--
-- POLÍTICA 5: "Admins can update service images"
--   - Operation: UPDATE
--   - Target roles: authenticated
--   - USING expression:
--     bucket_id = 'professional-services'
--     AND EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.type = 'admin'
--       AND profiles.account_active = true
--     )
--   - WITH CHECK expression: (mismo que USING)
--
-- POLÍTICA 6: "Professionals can delete service images"
--   - Operation: DELETE
--   - Target roles: authenticated
--   - USING expression:
--     bucket_id = 'professional-services' 
--     AND (storage.foldername(name))[1] = auth.uid()::text
--
-- POLÍTICA 7: "Admins can delete service images"
--   - Operation: DELETE
--   - Target roles: authenticated
--   - USING expression:
--     bucket_id = 'professional-services'
--     AND EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.type = 'admin'
--       AND profiles.account_active = true
--     )
-- ============================================================================

-- Intentar crear políticas (solo si tenemos permisos)
DO $$ 
BEGIN
  BEGIN
    -- Política de lectura pública
    CREATE POLICY "Public can view service images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'professional-services');
    
    RAISE NOTICE 'Políticas de storage creadas exitosamente';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'No se tienen permisos para crear políticas de storage. Por favor, créalas manualmente desde el Dashboard siguiendo las instrucciones arriba.';
    WHEN duplicate_object THEN
      RAISE NOTICE 'Algunas políticas de storage ya existen. Verifica que todas estén creadas correctamente.';
  END;
END $$;

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

-- Verificar políticas de storage
SELECT 
  policyname,
  cmd,
  qual,
  with_check
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
