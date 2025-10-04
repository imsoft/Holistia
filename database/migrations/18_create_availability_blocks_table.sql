-- Crear tabla para bloqueos de disponibilidad de profesionales
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- Título descriptivo del bloqueo (ej: "Vacaciones", "Capacitación")
  description TEXT, -- Descripción opcional
  block_type TEXT NOT NULL CHECK (block_type IN ('full_day', 'time_range')), -- Tipo de bloqueo
  start_date DATE NOT NULL, -- Fecha de inicio
  end_date DATE, -- Fecha de fin (para bloqueos de varios días)
  start_time TIME, -- Hora de inicio (para bloqueos de rango de tiempo)
  end_time TIME, -- Hora de fin (para bloqueos de rango de tiempo)
  is_recurring BOOLEAN DEFAULT FALSE, -- Si se repite semanalmente
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_availability_blocks_professional_id ON availability_blocks(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_user_id ON availability_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_dates ON availability_blocks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_type ON availability_blocks(block_type);

-- Habilitar RLS
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Profesionales pueden gestionar sus propios bloqueos
CREATE POLICY "Professionals can manage their own availability blocks"
ON availability_blocks FOR ALL
USING (professional_id IN (SELECT id FROM professional_applications WHERE user_id = auth.uid()))
WITH CHECK (professional_id IN (SELECT id FROM professional_applications WHERE user_id = auth.uid()));

-- Pacientes pueden ver bloqueos para verificar disponibilidad
CREATE POLICY "Patients can view availability blocks"
ON availability_blocks FOR SELECT
USING (
  professional_id IN (SELECT id FROM professional_applications WHERE status = 'approved')
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_availability_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_blocks_updated_at_trigger
BEFORE UPDATE ON availability_blocks
FOR EACH ROW EXECUTE FUNCTION update_availability_blocks_updated_at();

-- Comentarios
COMMENT ON TABLE availability_blocks IS 'Bloqueos de disponibilidad para profesionales';
COMMENT ON COLUMN availability_blocks.block_type IS 'Tipo de bloqueo: full_day (día completo) o time_range (rango de horas)';
COMMENT ON COLUMN availability_blocks.is_recurring IS 'Si el bloqueo se repite semanalmente';
