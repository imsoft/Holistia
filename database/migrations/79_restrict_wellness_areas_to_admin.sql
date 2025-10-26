-- Migración para restringir la edición de wellness_areas solo a administradores
-- Esta migración actualiza las políticas RLS para que solo los administradores
-- puedan modificar el campo wellness_areas en professional_applications

-- 1. Eliminar la política actual de actualización para usuarios
DROP POLICY IF EXISTS "Users can update own professional application" ON public.professional_applications;

-- 2. Crear nueva política para que los usuarios puedan actualizar su aplicación
-- EXCEPTO el campo wellness_areas
CREATE POLICY "Users can update own professional application" ON public.professional_applications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (
            -- Si el usuario está actualizando wellness_areas, debe ser admin
            wellness_areas = (SELECT wellness_areas FROM public.professional_applications WHERE id = professional_applications.id)
            OR
            -- O el usuario debe ser admin
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE auth.users.id = auth.uid()
                AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
            )
        )
    );

-- 3. Comentario para documentar el cambio
COMMENT ON POLICY "Users can update own professional application" ON public.professional_applications IS
'Permite a los usuarios actualizar su propia aplicación profesional, excepto el campo wellness_areas que solo puede ser modificado por administradores';
