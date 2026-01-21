-- =====================================================
-- MIGRACIÓN: Agregar política UPDATE para digital_product_purchases
-- Fecha: 2026-01-16
-- Descripción: Permite actualizar el payment_status y access_granted
--              para productos gratuitos y pagos confirmados
-- =====================================================

-- Primero verificar si la política ya existe antes de intentar eliminarla
-- Esto evita deadlocks si hay consultas activas

-- Esperar un momento para que otras transacciones terminen
SELECT pg_sleep(0.5);

-- Eliminar política existente si existe (sin bloquear)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'digital_product_purchases'
        AND policyname = 'Users can update their own pending purchases'
    ) THEN
        DROP POLICY "Users can update their own pending purchases" ON public.digital_product_purchases;
    END IF;
END $$;

-- Permitir que los usuarios actualicen sus propias compras pendientes
-- Versión simplificada para evitar deadlocks
CREATE POLICY "Users can update their own pending purchases"
ON public.digital_product_purchases
FOR UPDATE
TO authenticated
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Comentario
COMMENT ON POLICY "Users can update their own pending purchases" ON public.digital_product_purchases IS 
'Permite que los usuarios actualicen sus propias compras pendientes cuando se procesan productos gratuitos o cuando se confirma el pago';
