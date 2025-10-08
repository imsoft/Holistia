-- =====================================================
-- CREAR TABLA EVENTS_WORKSHOPS COMPLETA
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. CREAR TABLA EVENTS_WORKSHOPS
CREATE TABLE IF NOT EXISTS public.events_workshops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('unica', 'repetitiva')),
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

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_events_workshops_category ON public.events_workshops(category);
CREATE INDEX IF NOT EXISTS idx_events_workshops_date ON public.events_workshops(event_date);
CREATE INDEX IF NOT EXISTS idx_events_workshops_professional ON public.events_workshops(professional_id);
CREATE INDEX IF NOT EXISTS idx_events_workshops_active ON public.events_workshops(is_active);
CREATE INDEX IF NOT EXISTS idx_events_workshops_created_by ON public.events_workshops(created_by);

-- 3. CREAR TRIGGER PARA UPDATED_AT
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

-- 4. CONFIGURAR RLS
ALTER TABLE public.events_workshops ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS RLS
CREATE POLICY "Admins can manage all events" ON public.events_workshops
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

CREATE POLICY "Users can view active events" ON public.events_workshops
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Public can view active events" ON public.events_workshops
    FOR SELECT
    TO anon
    USING (is_active = true);

-- 6. VERIFICAR QUE TODO SE CREÓ
SELECT 'Tabla creada:' as status, table_name 
FROM information_schema.tables 
WHERE table_name = 'events_workshops' 
AND table_schema = 'public';

SELECT 'Políticas creadas:' as status, policyname 
FROM pg_policies 
WHERE tablename = 'events_workshops' 
AND schemaname = 'public'
ORDER BY policyname;
