-- ============================================================================
-- Script para corregir políticas RLS de la vista professional_patient_info
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Permitir que los profesionales vean información de sus pacientes
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar el estado actual de la vista
-- ============================================================================

SELECT 
  '🔍 ESTADO ACTUAL DE LA VISTA' as seccion,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as con_nombre
FROM professional_patient_info;

-- ============================================================================
-- PASO 2: Crear política RLS específica para la vista
-- ============================================================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Professionals can view their patients info" ON professional_patient_info;

-- Crear política para que los profesionales puedan ver información de sus pacientes
CREATE POLICY "Professionals can view their patients info"
  ON professional_patient_info
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM professional_applications pa
      WHERE pa.id = professional_patient_info.professional_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'approved'
    )
  );

-- ============================================================================
-- PASO 3: Otorgar permisos a la vista
-- ============================================================================

-- Otorgar permisos de SELECT a usuarios autenticados
GRANT SELECT ON professional_patient_info TO authenticated;

-- ============================================================================
-- PASO 4: Verificar que la política funciona
-- ============================================================================

-- Verificar que la política se creó correctamente
SELECT 
  '✅ POLÍTICA CREADA' as seccion,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'professional_patient_info'
  AND policyname = 'Professionals can view their patients info';

-- ============================================================================
-- PASO 5: Probar acceso a la vista
-- ============================================================================

-- Verificar que se puede acceder a la vista
SELECT 
  '🧪 PRUEBA DE ACCESO' as seccion,
  COUNT(*) as total_registros,
  'Si ves un número > 0, la vista funciona' as resultado
FROM professional_patient_info;

-- ============================================================================
-- PASO 6: Verificar datos específicos
-- ============================================================================

SELECT 
  '📊 DATOS ESPECÍFICOS' as seccion,
  patient_id,
  full_name,
  email,
  professional_id
FROM professional_patient_info
WHERE patient_id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937';

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- 1. Esta política permite que los profesionales vean información de sus pacientes
-- 2. Solo funciona para profesionales aprobados
-- 3. La vista ya tiene security_barrier = true
-- 4. Los datos deberían aparecer correctamente después de aplicar esta política
-- 
-- ============================================================================
