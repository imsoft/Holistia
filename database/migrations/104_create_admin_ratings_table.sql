-- =====================================================
-- MIGRACIÓN: Tabla de calificaciones de administradores
-- =====================================================
-- Crea una tabla para que los administradores puedan
-- calificar profesionales con escala 0-10 y comentarios
-- sobre qué mejorar
-- =====================================================

-- 1. Crear tabla admin_ratings
CREATE TABLE IF NOT EXISTS public.admin_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  improvement_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un administrador solo puede tener una calificación activa por profesional
  -- (pero puede actualizarla)
  UNIQUE(professional_id, admin_id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_admin_ratings_professional_id ON public.admin_ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_admin_ratings_admin_id ON public.admin_ratings(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_ratings_rating ON public.admin_ratings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_admin_ratings_created_at ON public.admin_ratings(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.admin_ratings ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS

-- Solo administradores pueden ver todas las calificaciones
CREATE POLICY "Admins can view all admin ratings"
  ON public.admin_ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' 
           OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- Solo administradores pueden crear calificaciones
CREATE POLICY "Admins can create admin ratings"
  ON public.admin_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' 
           OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
    AND auth.uid() = admin_id
  );

-- Solo administradores pueden actualizar calificaciones (solo las suyas)
CREATE POLICY "Admins can update their own ratings"
  ON public.admin_ratings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' 
           OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
    AND auth.uid() = admin_id
  )
  WITH CHECK (
    auth.uid() = admin_id
  );

-- Solo administradores pueden eliminar calificaciones (solo las suyas)
CREATE POLICY "Admins can delete their own ratings"
  ON public.admin_ratings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' 
           OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
    AND auth.uid() = admin_id
  );

-- Los profesionales pueden ver su propia calificación
CREATE POLICY "Professionals can view their own admin rating"
  ON public.admin_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_applications
      WHERE professional_applications.id = admin_ratings.professional_id
      AND professional_applications.user_id = auth.uid()
    )
  );

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_admin_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
CREATE TRIGGER update_admin_ratings_updated_at_trigger
  BEFORE UPDATE ON public.admin_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_ratings_updated_at();

-- 7. Vista para obtener la calificación promedio por profesional
CREATE OR REPLACE VIEW public.professional_admin_rating_stats AS
SELECT 
  professional_id,
  COUNT(*) as total_admin_ratings,
  ROUND(AVG(rating)::numeric, 1) as average_admin_rating,
  MAX(rating) as highest_admin_rating,
  MIN(rating) as lowest_admin_rating,
  MAX(updated_at) as last_rating_update
FROM public.admin_ratings
GROUP BY professional_id;

-- 8. Permisos para la vista
GRANT SELECT ON public.professional_admin_rating_stats TO authenticated;
GRANT SELECT ON public.professional_admin_rating_stats TO anon;

-- 9. Comentarios de documentación
COMMENT ON TABLE public.admin_ratings IS 
'Calificaciones de administradores para profesionales. Escala 0-10 con comentarios sobre mejoras';

COMMENT ON COLUMN public.admin_ratings.professional_id IS 
'ID del profesional calificado (referencia a professional_applications)';

COMMENT ON COLUMN public.admin_ratings.admin_id IS 
'ID del administrador que califica';

COMMENT ON COLUMN public.admin_ratings.rating IS 
'Calificación del 0 al 10';

COMMENT ON COLUMN public.admin_ratings.improvement_comments IS 
'Comentarios del administrador sobre qué puede mejorar el profesional';

-- =====================================================
-- NOTAS:
-- =====================================================
-- - Solo los administradores pueden crear/editar calificaciones
-- - Un admin solo puede tener una calificación por profesional (puede actualizarla)
-- - Los profesionales pueden ver su propia calificación
-- - La vista professional_admin_rating_stats proporciona estadísticas agregadas
-- =====================================================

