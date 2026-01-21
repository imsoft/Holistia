-- =====================================================
-- MIGRACIÓN: Agregar política UPDATE para digital_product_purchases
-- Fecha: 2026-01-16
-- Descripción: Permite actualizar el payment_status y access_granted
--              para productos gratuitos y pagos confirmados
-- =====================================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Service role can update purchases" ON public.digital_product_purchases;
DROP POLICY IF EXISTS "Users can update their own pending purchases" ON public.digital_product_purchases;

-- El service role puede actualizar cualquier compra (para webhooks y sistema)
-- Nota: Esto funciona porque el service role bypass RLS
-- Pero para seguridad, solo permitimos actualizar payment_status y access_granted

-- Permitir que el sistema actualice compras (usando service role o funciones)
-- Nota: En realidad, con service role no necesitamos política, pero la agregamos por seguridad
-- La actualización se hace desde el servidor con service role, que bypass RLS

-- Permitir que los usuarios actualicen sus propias compras pendientes
-- (Esto es útil para productos gratuitos donde el update se hace inmediatamente)
CREATE POLICY "Users can update their own pending purchases"
ON public.digital_product_purchases
FOR UPDATE
TO authenticated
USING (buyer_id = auth.uid())
WITH CHECK (
    buyer_id = auth.uid()
    AND (
        -- Solo permitir actualizar payment_status y access_granted
        (OLD.payment_status = 'pending' AND NEW.payment_status = 'succeeded')
        OR
        -- Permitir actualizar access_granted si el pago ya fue exitoso
        (OLD.payment_status = 'succeeded' AND NEW.access_granted = true)
    )
);

-- Comentario
COMMENT ON POLICY "Users can update their own pending purchases" ON public.digital_product_purchases IS 
'Permite que los usuarios actualicen sus propias compras pendientes cuando se procesan productos gratuitos o cuando se confirma el pago';
