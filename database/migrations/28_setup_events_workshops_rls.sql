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

-- Política para que los profesionales puedan actualizar sus propios eventos (solo ciertos campos)
CREATE POLICY "Professionals can update their events" ON public.events_workshops
    FOR UPDATE
    TO authenticated
    USING (
        professional_id IN (
            SELECT id FROM public.professional_applications 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        professional_id IN (
            SELECT id FROM public.professional_applications 
            WHERE user_id = auth.uid()
        )
    );
