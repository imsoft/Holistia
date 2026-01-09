-- ============================================================================
-- Script: Corregir política de admins para digital_products (CORRECCIÓN DIRECTA)
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Corregir inmediatamente la política para que admins puedan crear productos
-- ============================================================================

-- Eliminar política antigua que no tiene WITH CHECK
DROP POLICY IF EXISTS "Admins can do everything on digital_products" ON public.digital_products;

-- Crear política completa con USING y WITH CHECK
CREATE POLICY "Admins can do everything on digital_products"
ON public.digital_products
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

-- Verificar que se creó correctamente
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NULL THEN '❌ Sin USING'
    ELSE '✅ Con USING'
  END as using_status,
  CASE 
    WHEN with_check IS NULL THEN '❌ Sin WITH CHECK'
    ELSE '✅ Con WITH CHECK'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'digital_products'
  AND policyname = 'Admins can do everything on digital_products';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Este script corrige la política para que los admins puedan:
-- - INSERT (necesita WITH CHECK)
-- - UPDATE (necesita USING y WITH CHECK)
-- - DELETE (necesita USING)
-- - SELECT (necesita USING)
-- ============================================================================
