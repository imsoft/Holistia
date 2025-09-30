-- SQL para crear la tabla de solicitudes de profesionales
-- Ejecuta este SQL completo en el SQL Editor de Supabase

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS professional_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Información profesional
  profession TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT NOT NULL,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  
  -- Información de servicios
  services JSONB NOT NULL DEFAULT '[]',
  
  -- Información de ubicación
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'México',
  
  -- Información adicional
  biography TEXT,
  profile_photo TEXT,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  
  -- Estado de la solicitud
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Metadatos
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  -- Términos aceptados
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_professional_applications_user_id ON professional_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_applications_status ON professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_professional_applications_submitted_at ON professional_applications(submitted_at);

-- 3. Habilitar RLS
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS

-- Política para que los usuarios solo puedan ver sus propias solicitudes
CREATE POLICY "Users can view their own applications" ON professional_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear sus propias solicitudes
CREATE POLICY "Users can create their own applications" ON professional_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propias solicitudes (solo si están pendientes)
CREATE POLICY "Users can update pending applications" ON professional_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Política para que los administradores puedan ver todas las solicitudes
-- Nota: Esta política asume que los admins tienen type='admin' en user_metadata
CREATE POLICY "Admins can view all applications" ON professional_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- Política para que los administradores puedan actualizar todas las solicitudes
CREATE POLICY "Admins can update all applications" ON professional_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_professional_applications_updated_at 
  BEFORE UPDATE ON professional_applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
