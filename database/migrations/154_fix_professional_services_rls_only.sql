-- ============================================================================
-- MIGRACIÓN 154: Corregir RLS para Professional Services (SOLO RLS)
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Actualizar políticas RLS para que admins puedan gestionar servicios
-- NOTA: Este script SOLO actualiza políticas RLS, NO toca storage
-- ============================================================================

-- ============================================================================
-- ACTUALIZAR POLÍTICAS RLS DE PROFESSIONAL_SERVICES
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
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Admins can manage all services" ON public.professional_services
IS 'Permite a administradores gestionar todos los servicios de profesionales';

-- ============================================================================
-- VERIFICACIÓN DE POLÍTICAS RLS
-- ============================================================================

-- Verificar que las políticas RLS se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'professional_services'
ORDER BY policyname;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. Este script SOLO actualiza políticas RLS de la tabla professional_services
-- 2. NO modifica políticas de storage (esas se crean desde el Dashboard)
-- 3. Los admins ahora pueden gestionar todos los servicios
-- 4. Los profesionales solo pueden gestionar sus propios servicios
-- 5. Para políticas de storage, ver: database/scripts/agregar_politicas_admin_storage_professional_services.md
-- ============================================================================
