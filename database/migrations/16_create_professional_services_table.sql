-- Migración para crear la tabla de servicios profesionales
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Crear la tabla professional_services
CREATE TABLE IF NOT EXISTS professional_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del servicio
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('session', 'program')),
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'online', 'both')),
  duration INTEGER NOT NULL, -- Duración en minutos
  
  -- Costos
  cost JSONB NOT NULL DEFAULT '{}', -- { presencial: number, online: number }
  
  -- Estado del servicio
  isActive BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_professional_services_professional_id ON professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_user_id ON professional_services(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_isActive ON professional_services(isActive);
CREATE INDEX IF NOT EXISTS idx_professional_services_type ON professional_services(type);

-- 3. Habilitar RLS
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS

-- Política para que los profesionales solo puedan ver/editar sus propios servicios
CREATE POLICY "Professionals can manage their own services" ON professional_services
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política para que los pacientes puedan ver servicios activos de profesionales aprobados
CREATE POLICY "Patients can view active services" ON professional_services
  FOR SELECT TO authenticated
  USING (
    isActive = true AND
    EXISTS (
      SELECT 1 FROM professional_applications pa
      WHERE pa.id = professional_id
      AND pa.status = 'approved'
    )
  );

-- Política para administradores (opcional)
CREATE POLICY "Admins can manage all services" ON professional_services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );

-- 5. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_professional_services_updated_at
  BEFORE UPDATE ON professional_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentarios en la tabla y columnas
COMMENT ON TABLE professional_services IS 'Servicios ofrecidos por profesionales de la salud';
COMMENT ON COLUMN professional_services.professional_id IS 'ID de la aplicación profesional';
COMMENT ON COLUMN professional_services.user_id IS 'ID del usuario profesional';
COMMENT ON COLUMN professional_services.name IS 'Nombre del servicio';
COMMENT ON COLUMN professional_services.description IS 'Descripción detallada del servicio';
COMMENT ON COLUMN professional_services.type IS 'Tipo: session (sesión individual) o program (programa/paquete)';
COMMENT ON COLUMN professional_services.modality IS 'Modalidad: presencial, online o both';
COMMENT ON COLUMN professional_services.duration IS 'Duración del servicio en minutos';
COMMENT ON COLUMN professional_services.cost IS 'Costos en formato JSON: { presencial: number, online: number }';
COMMENT ON COLUMN professional_services.isActive IS 'Si el servicio está activo y disponible para reservas';
