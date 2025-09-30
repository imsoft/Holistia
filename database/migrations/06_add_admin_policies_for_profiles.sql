-- Permitir que los administradores vean todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin'
    );

-- Permitir que los administradores actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin'
    );
