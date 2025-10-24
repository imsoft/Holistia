-- ============================================================================
-- MIGRACIÓN: Permitir que profesionales vean pagos de sus citas
-- ============================================================================
-- Fecha: 24 de octubre de 2025
-- Problema: Profesionales no pueden ver los pagos de sus citas (solo de eventos)
-- Solución: Agregar política RLS para payments de tipo 'appointment'
-- ============================================================================

-- Eliminar política si ya existe (por si acaso)
DROP POLICY IF EXISTS "Professionals can view payments for their appointments" ON payments;

-- Crear política para que profesionales vean pagos de SUS citas
CREATE POLICY "Professionals can view payments for their appointments"
ON payments
FOR SELECT
USING (
  payment_type = 'appointment'
  AND EXISTS (
    SELECT 1
    FROM appointments a
    INNER JOIN professional_applications pa ON pa.id = a.professional_id
    WHERE a.id = payments.appointment_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'approved'
  )
);

-- Verificar que la política se creó correctamente
SELECT 
  '✅ Política creada correctamente' as resultado,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payments'
  AND policyname = 'Professionals can view payments for their appointments';

-- ============================================================================
-- COMENTARIO
-- ============================================================================
COMMENT ON POLICY "Professionals can view payments for their appointments" ON payments IS
'Permite a profesionales aprobados ver los pagos relacionados con sus citas (appointments)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Para verificar que funciona, ejecuta (como profesional):
-- SELECT * FROM payments WHERE payment_type = 'appointment';
-- 
-- Deberías ver los pagos de tus propias citas
-- ============================================================================

