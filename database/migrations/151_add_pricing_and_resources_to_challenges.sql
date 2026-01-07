-- ============================================================================
-- MIGRACIÓN 151: Agregar precio y recursos a challenges
-- ============================================================================
-- Fecha: 2026-01-07
-- Propósito:
--   - Permitir que profesionales cobren por sus retos
--   - Permitir agregar múltiples recursos (ebooks, audios, etc.) a los retos
--   - Retos de pacientes siguen siendo gratuitos
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR CAMPOS DE PRECIO A CHALLENGES
-- ============================================================================

-- Agregar campos de precio (opcional, solo para profesionales)
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MXN';

-- Agregar constraint: Si lo crea un profesional y tiene precio, debe ser > 0
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_price_positive CHECK (
    price IS NULL OR price >= 0
  );

-- Comentarios
COMMENT ON COLUMN public.challenges.price IS 'Precio del reto (solo para retos de profesionales, NULL = gratuito)';
COMMENT ON COLUMN public.challenges.currency IS 'Moneda del precio del reto (MXN por defecto)';

-- ============================================================================
-- 2. CREAR TABLA DE RECURSOS/ENLACES DE CHALLENGES
-- ============================================================================

-- Crear tabla para almacenar múltiples recursos por challenge
CREATE TABLE IF NOT EXISTS public.challenge_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('ebook', 'audio', 'video', 'pdf', 'link', 'other')),
  url TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_minutes INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_challenge_resources_challenge_id ON public.challenge_resources(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_resources_type ON public.challenge_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_challenge_resources_active ON public.challenge_resources(is_active);

-- Comentarios
COMMENT ON TABLE public.challenge_resources IS 'Recursos y enlaces asociados a un reto (ebooks, audios, videos, etc.)';
COMMENT ON COLUMN public.challenge_resources.challenge_id IS 'ID del reto al que pertenece este recurso';
COMMENT ON COLUMN public.challenge_resources.title IS 'Título del recurso';
COMMENT ON COLUMN public.challenge_resources.description IS 'Descripción del recurso';
COMMENT ON COLUMN public.challenge_resources.resource_type IS 'Tipo de recurso: ebook, audio, video, pdf, link, other';
COMMENT ON COLUMN public.challenge_resources.url IS 'URL del recurso (puede ser externa o de storage)';
COMMENT ON COLUMN public.challenge_resources.file_size_bytes IS 'Tamaño del archivo en bytes (opcional)';
COMMENT ON COLUMN public.challenge_resources.duration_minutes IS 'Duración en minutos (para audios/videos)';
COMMENT ON COLUMN public.challenge_resources.display_order IS 'Orden de visualización';

-- ============================================================================
-- 3. POLÍTICAS RLS PARA CHALLENGE_RESOURCES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.challenge_resources ENABLE ROW LEVEL SECURITY;

-- Política: Creadores pueden insertar recursos en sus propios retos
CREATE POLICY "Challenge creators can insert resources"
ON public.challenge_resources
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE id = challenge_resources.challenge_id
    AND created_by_user_id = auth.uid()
  )
);

-- Política: Usuarios pueden ver recursos de retos a los que tienen acceso
CREATE POLICY "Users can view resources of accessible challenges"
ON public.challenge_resources
FOR SELECT
TO authenticated
USING (
  is_active = true AND (
    -- Participantes del reto pueden ver recursos
    EXISTS (
      SELECT 1 FROM public.challenge_purchases cp
      WHERE cp.challenge_id = challenge_resources.challenge_id
      AND cp.participant_id = auth.uid()
      AND cp.access_granted = true
    )
    OR
    -- Creador del reto puede ver recursos
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_resources.challenge_id
      AND c.created_by_user_id = auth.uid()
    )
    OR
    -- Profesional vinculado puede ver recursos
    EXISTS (
      SELECT 1 FROM public.challenges c
      INNER JOIN public.professional_applications pa ON c.linked_professional_id = pa.id
      WHERE c.id = challenge_resources.challenge_id
      AND pa.user_id = auth.uid()
    )
  )
);

-- Política: Creadores pueden actualizar recursos de sus retos
CREATE POLICY "Challenge creators can update their resources"
ON public.challenge_resources
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE id = challenge_resources.challenge_id
    AND created_by_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE id = challenge_resources.challenge_id
    AND created_by_user_id = auth.uid()
  )
);

-- Política: Creadores pueden eliminar recursos de sus retos
CREATE POLICY "Challenge creators can delete their resources"
ON public.challenge_resources
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE id = challenge_resources.challenge_id
    AND created_by_user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. TRIGGER PARA UPDATED_AT
-- ============================================================================

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_challenge_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_challenge_resources_updated_at
  BEFORE UPDATE ON public.challenge_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_resources_updated_at();

-- ============================================================================
-- 5. ACTUALIZAR VISTA challenges_with_professional
-- ============================================================================

-- Primero eliminar la vista existente
DROP VIEW IF EXISTS public.challenges_with_professional;

-- Recrear la vista para incluir información de precio
CREATE VIEW public.challenges_with_professional AS
SELECT
    c.id,
    c.professional_id,
    c.created_by_user_id,
    c.created_by_type,
    c.linked_patient_id,
    c.linked_professional_id,
    c.title,
    c.description,
    c.short_description,
    c.cover_image_url,
    c.duration_days,
    c.difficulty_level,
    c.category,
    c.wellness_areas,
    c.price,
    c.currency,
    c.is_active,
    c.created_at,
    c.updated_at,
    -- Información del profesional creador (si existe)
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    pa.profession as professional_profession,
    pa.is_verified as professional_is_verified,
    -- Información del profesional vinculado (si existe)
    linked_pa.first_name as linked_professional_first_name,
    linked_pa.last_name as linked_professional_last_name,
    linked_pa.profile_photo as linked_professional_photo,
    linked_pa.profession as linked_professional_profession,
    linked_pa.is_verified as linked_professional_is_verified
FROM public.challenges c
LEFT JOIN public.professional_applications pa ON c.professional_id = pa.id
LEFT JOIN public.professional_applications linked_pa ON c.linked_professional_id = linked_pa.id
WHERE c.is_active = true
AND (pa.status = 'approved' OR pa.id IS NULL)
AND (pa.is_active = true OR pa.id IS NULL);

COMMENT ON VIEW public.challenges_with_professional IS 'Vista de retos activos con información del profesional creador, vinculado y precio';

-- ============================================================================
-- 6. ACTUALIZAR TABLA CHALLENGE_PURCHASES PARA SOPORTAR PAGOS
-- ============================================================================

-- Agregar campos de pago
ALTER TABLE public.challenge_purchases
  ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed';

-- Crear índice para payment_status
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_payment_status ON public.challenge_purchases(payment_status);

-- Comentarios
COMMENT ON COLUMN public.challenge_purchases.amount IS 'Monto pagado por el reto (NULL si es gratuito)';
COMMENT ON COLUMN public.challenge_purchases.currency IS 'Moneda del pago';
COMMENT ON COLUMN public.challenge_purchases.stripe_payment_intent_id IS 'ID de Stripe Payment Intent';
COMMENT ON COLUMN public.challenge_purchases.payment_status IS 'Estado del pago: pending, completed, failed, refunded';

-- Actualizar lógica de access_granted: debe estar vinculado al pago o ser gratuito
ALTER TABLE public.challenge_purchases
  ALTER COLUMN access_granted SET DEFAULT false;

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- REGLAS DE NEGOCIO:
-- 1. Retos creados por PROFESIONALES:
--    - Pueden tener precio (price > 0) o ser gratuitos (price = NULL o 0)
--    - Pueden agregar múltiples recursos (ebooks, audios, videos, etc.)
--    - Son visibles públicamente si is_active = true
--
-- 2. Retos creados por PACIENTES:
--    - Siempre son gratuitos (price debe ser NULL)
--    - Son privados por defecto (solo el creador, invitados y profesional vinculado)
--    - Pueden agregar recursos
--
-- 3. Recursos de retos:
--    - Múltiples recursos por reto
--    - Solo visible para participantes con access_granted = true
--    - Creador puede agregar/editar/eliminar recursos
--
-- 4. Access control:
--    - Retos de pago requieren payment_status = 'completed' para access_granted = true
--    - Retos gratuitos tienen access_granted = true automáticamente
--    - Retos de pacientes requieren invitación explícita
--
