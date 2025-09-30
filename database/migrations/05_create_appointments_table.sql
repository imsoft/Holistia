-- SQL para crear la tabla de citas (appointments)
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Crear la tabla appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  appointment_type VARCHAR(20) NOT NULL CHECK (appointment_type IN ('presencial', 'online')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cost DECIMAL(10,2) NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- 3. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS

-- Política para que los pacientes puedan ver sus propias citas
CREATE POLICY "Patients can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = patient_id);

-- Política para que los pacientes puedan crear sus propias citas
CREATE POLICY "Patients can create their own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Política para que los pacientes puedan actualizar sus propias citas (cancelar)
CREATE POLICY "Patients can update their own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = patient_id);

-- Política para que los profesionales puedan ver las citas con ellos
CREATE POLICY "Professionals can view their appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_applications 
      WHERE professional_applications.id = appointments.professional_id 
      AND professional_applications.user_id = auth.uid()
      AND professional_applications.status = 'approved'
    )
  );

-- Política para que los profesionales puedan actualizar el estado de sus citas
CREATE POLICY "Professionals can update their appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM professional_applications 
      WHERE professional_applications.id = appointments.professional_id 
      AND professional_applications.user_id = auth.uid()
      AND professional_applications.status = 'approved'
    )
  );

-- Política para que los administradores puedan ver todas las citas
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- Política para que los administradores puedan gestionar todas las citas
CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );
