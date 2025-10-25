-- ============================================================================
-- MIGRACIÓN 63: Actualizar última política pendiente
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Tabla: professional_applications
-- Política: "Admins can delete all applications"
-- Problema: Aún usa auth.users.raw_user_meta_data
-- ============================================================================

-- DROP la política antigua
DROP POLICY IF EXISTS "Admins can delete all applications" ON public.professional_applications;

-- CREATE nueva política que usa profiles
CREATE POLICY "Admins can delete all applications"
ON public.professional_applications
FOR DELETE
USING (
  -- Condición 1: Email específico de super admin
  (auth.jwt() ->> 'email') = 'holistia.io@gmail.com'
  OR
  -- Condición 2: Usuario admin (ahora usando profiles)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
  '✅ VERIFICACIÓN FINAL' as resultado,
  'Políticas que aún usan raw_user_meta_data' as metrica,
  COUNT(*)::text as valor
FROM pg_policies
WHERE (
  qual::text LIKE '%raw_user_meta_data%' 
  OR with_check::text LIKE '%raw_user_meta_data%'
)
AND schemaname = 'public'

UNION ALL

SELECT 
  '✅ VERIFICACIÓN FINAL',
  'Políticas en professional_applications',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'professional_applications'

UNION ALL

SELECT 
  '✅ VERIFICACIÓN FINAL',
  'Políticas que usan profiles.type',
  COUNT(*)::text
FROM pg_policies
WHERE (qual::text LIKE '%profiles.type%' OR with_check::text LIKE '%profiles.type%')
AND schemaname = 'public';

-- ============================================================================
-- RESUMEN
-- ============================================================================

WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE qual::text LIKE '%raw_user_meta_data%' OR with_check::text LIKE '%raw_user_meta_data%') as usa_metadata,
    COUNT(*) FILTER (WHERE qual::text LIKE '%profiles.type%' OR with_check::text LIKE '%profiles.type%') as usa_profiles
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  CASE 
    WHEN usa_metadata = 0 AND usa_profiles >= 24
    THEN '🎉 MIGRACIÓN RLS 100% COMPLETADA - TODAS LAS POLÍTICAS USAN PROFILES'
    WHEN usa_metadata = 0
    THEN '✅ MIGRACIÓN COMPLETADA - Sin políticas usando metadata'
    ELSE '⚠️  AÚN HAY ' || usa_metadata::text || ' POLÍTICA(S) POR ACTUALIZAR'
  END as estado,
  usa_metadata as politicas_pendientes,
  usa_profiles as politicas_con_profiles
FROM stats;

-- ============================================================================
-- FIN
-- ============================================================================

