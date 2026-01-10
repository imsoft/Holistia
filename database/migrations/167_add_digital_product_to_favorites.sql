-- Migración 167: Agregar soporte para favoritos de productos digitales (programas)
-- Extender tabla de favoritos para incluir digital_product_id

-- 1. Agregar columna digital_product_id
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS digital_product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE;

-- 2. Actualizar constraint check para incluir digital_product_id
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
      CASE WHEN digital_product_id IS NOT NULL THEN 1 ELSE 0 END
    ) = 1
  );

-- 3. Crear índice para digital_product_id
CREATE INDEX IF NOT EXISTS idx_user_favorites_digital_product_id ON user_favorites(digital_product_id);

-- 4. Crear constraint único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_digital_product_favorite
  ON user_favorites(user_id, digital_product_id)
  WHERE digital_product_id IS NOT NULL;

-- Comentarios:
-- - Se mantiene compatibilidad con todos los tipos de favoritos existentes
-- - digital_product_id puede ser agregado a favoritos igual que otros tipos
-- - El constraint asegura que solo un tipo de ID esté presente a la vez
