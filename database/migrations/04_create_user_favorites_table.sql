-- SQL para crear la tabla de favoritos de usuarios
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Crear la tabla user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados: un usuario no puede tener el mismo profesional como favorito dos veces
  UNIQUE(user_id, professional_id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_professional_id ON user_favorites(professional_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- 3. Habilitar RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS

-- Política para que los usuarios solo puedan ver sus propios favoritos
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear sus propios favoritos
CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios favoritos
CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Política para que los administradores puedan ver todos los favoritos
CREATE POLICY "Admins can view all favorites" ON user_favorites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );
