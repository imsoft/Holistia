-- Habilitar Row Level Security en professional_applications
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean su propia aplicación
CREATE POLICY "Users can view own professional application" ON professional_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar su propia aplicación
CREATE POLICY "Users can insert own professional application" ON professional_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar su propia aplicación
CREATE POLICY "Users can update own professional application" ON professional_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar su propia aplicación
CREATE POLICY "Users can delete own professional application" ON professional_applications
    FOR DELETE USING (auth.uid() = user_id);

-- Política especial para que los pacientes puedan ver aplicaciones aprobadas
-- Esto permite que los pacientes vean los perfiles de profesionales aprobados
CREATE POLICY "Patients can view approved professionals" ON professional_applications
    FOR SELECT USING (status = 'approved');

-- Política para administradores (si tienes un sistema de roles)
-- Asumiendo que tienes una tabla de roles o un campo is_admin en auth.users
-- CREATE POLICY "Admins can manage all applications" ON professional_applications
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM auth.users 
--             WHERE id = auth.uid() 
--             AND raw_user_meta_data->>'role' = 'admin'
--         )
--     );

-- Comentarios para documentar las políticas
COMMENT ON POLICY "Users can view own professional application" ON professional_applications 
    IS 'Permite a los usuarios ver solo su propia aplicación profesional';

COMMENT ON POLICY "Users can insert own professional application" ON professional_applications 
    IS 'Permite a los usuarios crear solo su propia aplicación profesional';

COMMENT ON POLICY "Users can update own professional application" ON professional_applications 
    IS 'Permite a los usuarios actualizar solo su propia aplicación profesional';

COMMENT ON POLICY "Users can delete own professional application" ON professional_applications 
    IS 'Permite a los usuarios eliminar solo su propia aplicación profesional';

COMMENT ON POLICY "Patients can view approved professionals" ON professional_applications 
    IS 'Permite a los pacientes ver perfiles de profesionales aprobados';
