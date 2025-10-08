-- Crear tabla para eventos y talleres
CREATE TABLE IF NOT EXISTS public.events_workshops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('unique', 'recurring')),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    has_parking BOOLEAN NOT NULL DEFAULT false,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('espiritualidad', 'salud_mental', 'salud_fisica', 'alimentacion', 'social')),
    location TEXT NOT NULL,
    description TEXT,
    participant_level VARCHAR(20) NOT NULL CHECK (participant_level IN ('principiante', 'medio', 'avanzado')),
    professional_id UUID REFERENCES public.professional_applications(id) ON DELETE SET NULL,
    gallery_images TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Crear índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_events_workshops_category ON public.events_workshops(category);
CREATE INDEX IF NOT EXISTS idx_events_workshops_date ON public.events_workshops(event_date);
CREATE INDEX IF NOT EXISTS idx_events_workshops_professional ON public.events_workshops(professional_id);
CREATE INDEX IF NOT EXISTS idx_events_workshops_active ON public.events_workshops(is_active);
CREATE INDEX IF NOT EXISTS idx_events_workshops_created_by ON public.events_workshops(created_by);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_events_workshops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_workshops_updated_at
    BEFORE UPDATE ON public.events_workshops
    FOR EACH ROW
    EXECUTE FUNCTION update_events_workshops_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.events_workshops IS 'Tabla para almacenar eventos y talleres organizados por la plataforma';
COMMENT ON COLUMN public.events_workshops.name IS 'Nombre del evento o taller';
COMMENT ON COLUMN public.events_workshops.duration_hours IS 'Duración en horas del evento';
COMMENT ON COLUMN public.events_workshops.session_type IS 'Tipo de sesión: unique (única) o recurring (recurrente)';
COMMENT ON COLUMN public.events_workshops.price IS 'Precio del evento en MXN';
COMMENT ON COLUMN public.events_workshops.is_free IS 'Indica si el evento es gratuito';
COMMENT ON COLUMN public.events_workshops.max_capacity IS 'Cupo máximo de participantes';
COMMENT ON COLUMN public.events_workshops.has_parking IS 'Indica si hay estacionamiento disponible';
COMMENT ON COLUMN public.events_workshops.event_date IS 'Fecha del evento';
COMMENT ON COLUMN public.events_workshops.event_time IS 'Hora del evento';
COMMENT ON COLUMN public.events_workshops.category IS 'Categoría del evento';
COMMENT ON COLUMN public.events_workshops.location IS 'Ubicación del evento';
COMMENT ON COLUMN public.events_workshops.description IS 'Descripción detallada del evento';
COMMENT ON COLUMN public.events_workshops.participant_level IS 'Nivel requerido del participante';
COMMENT ON COLUMN public.events_workshops.professional_id IS 'ID del profesional que imparte el evento';
COMMENT ON COLUMN public.events_workshops.gallery_images IS 'Array de URLs de imágenes de la galería';
COMMENT ON COLUMN public.events_workshops.is_active IS 'Indica si el evento está activo';
COMMENT ON COLUMN public.events_workshops.created_by IS 'ID del usuario que creó el evento (debe ser admin)';
