-- =====================================================
-- SOLUCIONAR POLÍTICAS RLS PARA EVENTS_WORKSHOPS
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events_workshops;
DROP POLICY IF EXISTS "Users can view active events" ON public.events_workshops;
DROP POLICY IF EXISTS "Public can view active events" ON public.events_workshops;

-- 2. CREAR POLÍTICA TEMPORAL MUY PERMISIVA
CREATE POLICY "Allow all for authenticated users" ON public.events_workshops
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. POLÍTICA PARA USUARIOS NO AUTENTICADOS (solo lectura)
CREATE POLICY "Public can view active events" ON public.events_workshops
    FOR SELECT
    TO anon
    USING (is_active = true);

-- 4. VERIFICAR POLÍTICAS CREADAS
SELECT 'Políticas creadas:' as status, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'events_workshops' 
AND schemaname = 'public'
ORDER BY policyname;
