-- =====================================================
-- MIGRACIONES: Sistema de Eventos y Talleres
-- =====================================================
-- Fecha: $(date)
-- Descripción: Crear sistema completo de eventos y talleres para administradores

-- =====================================================
-- 1. CREAR TABLA DE EVENTOS Y TALLERES
-- =====================================================

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

-- =====================================================
-- 2. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en la tabla events_workshops
ALTER TABLE public.events_workshops ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores puedan hacer todo
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

-- Política para que los usuarios autenticados puedan leer eventos activos
CREATE POLICY "Users can view active events" ON public.events_workshops
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Política para que los usuarios no autenticados puedan leer eventos activos (públicos)
CREATE POLICY "Public can view active events" ON public.events_workshops
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Política para que los profesionales puedan ver sus propios eventos
CREATE POLICY "Professionals can view their events" ON public.events_workshops
    FOR SELECT
    TO authenticated
    USING (
        professional_id IN (
            SELECT id FROM public.professional_applications 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. CONFIGURAR STORAGE PARA GALERÍA DE IMÁGENES
-- =====================================================

-- Crear bucket para galería de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Política para que los administradores puedan subir imágenes
CREATE POLICY "Admins can upload event images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'event-gallery' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

-- Política para que los administradores puedan actualizar imágenes
CREATE POLICY "Admins can update event images" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'event-gallery' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

-- Política para que los administradores puedan eliminar imágenes
CREATE POLICY "Admins can delete event images" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'event-gallery' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

-- Política para que todos puedan ver las imágenes (públicas)
CREATE POLICY "Public can view event images" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-gallery');

-- Política para que usuarios autenticados puedan ver las imágenes
CREATE POLICY "Authenticated users can view event images" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'event-gallery');

-- =====================================================
-- 4. VERIFICACIONES
-- =====================================================

-- Verificar que la tabla se creó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events_workshops' 
ORDER BY ordinal_position;

-- Verificar que los índices se crearon
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'events_workshops';

-- Verificar que el bucket se creó
SELECT * FROM storage.buckets WHERE id = 'event-gallery';

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecutar este script completo en el SQL Editor de Supabase
-- 2. Verificar que no hay errores en la ejecución
-- 3. Confirmar que la tabla, índices y políticas se crearon
-- 4. Verificar que el bucket de storage se configuró
-- 5. Los administradores podrán acceder a /admin/[id]/events
-- =====================================================
