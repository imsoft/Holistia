-- Extender tabla de favoritos para soportar múltiples tipos de contenido
-- Mantener compatibilidad con favoritos de profesionales existentes

-- 1. Agregar nuevas columnas para diferentes tipos de contenido
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events_workshops(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS favorite_type VARCHAR(50) DEFAULT 'professional';

-- 2. Actualizar registros existentes
UPDATE user_favorites
SET favorite_type = 'professional'
WHERE favorite_type IS NULL OR favorite_type = 'professional';

-- 3. Eliminar la restricción UNIQUE antigua
ALTER TABLE user_favorites
  DROP CONSTRAINT IF EXISTS user_favorites_user_id_professional_id_key;

-- 4. Hacer professional_id nullable para permitir otros tipos
ALTER TABLE user_favorites
  ALTER COLUMN professional_id DROP NOT NULL;

-- 5. Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_user_favorites_challenge_id ON user_favorites(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_restaurant_id ON user_favorites(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_shop_id ON user_favorites(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites(favorite_type);

-- 6. Agregar constraint para asegurar que solo uno de los IDs esté presente
ALTER TABLE user_favorites
  ADD CONSTRAINT check_single_favorite_type CHECK (
    (
      CASE WHEN professional_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN challenge_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN event_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN restaurant_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN shop_id IS NOT NULL THEN 1 ELSE 0 END
    ) = 1
  );

-- 7. Agregar constraints únicos compuestos para cada tipo
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_professional_favorite
  ON user_favorites(user_id, professional_id)
  WHERE professional_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_challenge_favorite
  ON user_favorites(user_id, challenge_id)
  WHERE challenge_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_event_favorite
  ON user_favorites(user_id, event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_restaurant_favorite
  ON user_favorites(user_id, restaurant_id)
  WHERE restaurant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_shop_favorite
  ON user_favorites(user_id, shop_id)
  WHERE shop_id IS NOT NULL;

-- 8. Actualizar las políticas RLS para incluir los nuevos tipos
-- Las políticas existentes ya funcionan porque usan user_id

-- Comentarios sobre el diseño:
-- - Se mantiene compatibilidad con favoritos de profesionales existentes
-- - favorite_type indica qué tipo de contenido es (professional, challenge, event, restaurant, shop)
-- - Solo uno de los IDs puede estar presente (check constraint)
-- - Índices únicos parciales previenen duplicados por tipo
-- - RLS ya funcionaba a nivel de user_id, no necesita cambios
