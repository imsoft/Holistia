-- =====================================================
-- CREAR TABLA DE EVENTOS CON SOPORTE DE IMÁGENES
-- =====================================================
-- Ejecutar este archivo en el SQL Editor de Supabase

-- 1. Crear tabla events_workshops con soporte de imágenes
CREATE TABLE IF NOT EXISTS public.events_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('espiritualidad', 'salud_mental', 'salud_fisica', 'alimentacion', 'social')),
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  duration_hours INTEGER NOT NULL DEFAULT 1,
  professional_id UUID REFERENCES public.professional_applications(id),
  is_active BOOLEAN DEFAULT true,
  image_url TEXT, -- URL de la imagen principal del evento
  gallery_images TEXT[], -- Array de URLs de imágenes de la galería
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.events_workshops ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad
CREATE POLICY "Authenticated users can view active events"
ON public.events_workshops FOR SELECT
USING (is_active = true);

CREATE POLICY "Administrators can manage all events"
ON public.events_workshops FOR ALL
USING (EXISTS (SELECT 1 FROM public.get_user_role(auth.uid()) AS role WHERE role = 'admin'));

CREATE POLICY "Professionals can manage their own events"
ON public.events_workshops FOR ALL
USING (
  professional_id = (SELECT id FROM public.professional_applications WHERE user_id = auth.uid())
);

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_events_workshops_category ON public.events_workshops(category);
CREATE INDEX IF NOT EXISTS idx_events_workshops_event_date ON public.events_workshops(event_date);
CREATE INDEX IF NOT EXISTS idx_events_workshops_professional_id ON public.events_workshops(professional_id);
CREATE INDEX IF NOT EXISTS idx_events_workshops_is_active ON public.events_workshops(is_active);

-- 5. Crear bucket de almacenamiento para imágenes de eventos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event_images', 'event_images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Crear políticas de almacenamiento para imágenes de eventos
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event_images');

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event_images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event_images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event_images' AND auth.role() = 'authenticated');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que todo se creó correctamente:

-- 1. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events_workshops' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver políticas de RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'events_workshops';

-- 3. Ver bucket de almacenamiento
SELECT * FROM storage.buckets WHERE id = 'event_images';

-- 4. Ver políticas de almacenamiento
SELECT * FROM storage.policies WHERE bucket_id = 'event_images';
