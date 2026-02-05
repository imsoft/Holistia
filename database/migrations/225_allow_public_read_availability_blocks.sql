-- ============================================================================
-- MIGRACIÓN 225: Lectura pública de availability_blocks para calendario estable
-- ============================================================================
-- Propósito:
--   Permitir que cualquier usuario (anon y authenticated) pueda leer los
--   bloqueos de disponibilidad. Así el calendario de reservas en la ficha del
--   profesional muestra siempre los mismos datos, sin depender del estado de
--   la sesión (evita que las fechas bloqueadas "aparezcan y desaparezcan"
--   al recargar por race condition con auth.uid()).
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view availability blocks" ON public.availability_blocks;

CREATE POLICY "Public can view availability blocks for booking"
ON public.availability_blocks
FOR SELECT
TO anon, authenticated
USING (true);

COMMENT ON POLICY "Public can view availability blocks for booking" ON public.availability_blocks IS
  'Permite a cualquier visitante (anon y authenticated) ver bloqueos de disponibilidad para que el calendario de reservas muestre siempre la misma disponibilidad, sin depender del estado de la sesión.';
