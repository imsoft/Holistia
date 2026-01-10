-- Migración 168: Agregar soporte para favoritos de centros holísticos
-- Extender tabla de favoritos para incluir holistic_center_id

-- 1. Agregar columna holistic_center_id
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS holistic_center_id UUID REFERENCES holistic_centers(id) ON DELETE CASCADE;

-- 2. Actualizar constraint check para incluir holistic_center_id
ALTER TABLE user_favorites
  DROP CONSTRAINT IF EXISTS check_single_favorite_type;

ALTER TABLE user_favorites
  ADD CONSTRAINT check_single_favorite_type CHECK (
    (
      CASE WHEN professional_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN challenge_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN event_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN restaurant_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN shop_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN digital_product_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN holistic_center_id IS NOT NULL THEN 1 ELSE 0 END
    ) = 1
  );

-- 3. Crear índice para holistic_center_id
CREATE INDEX IF NOT EXISTS idx_user_favorites_holistic_center_id ON user_favorites(holistic_center_id);

-- 4. Crear constraint único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_holistic_center_favorite
  ON user_favorites(user_id, holistic_center_id)
  WHERE holistic_center_id IS NOT NULL;

-- Comentarios:
-- - Se mantiene compatibilidad con todos los tipos de favoritos existentes
-- - holistic_center_id puede ser agregado a favoritos igual que otros tipos
-- - El constraint asegura que solo un tipo de ID esté presente a la vez
