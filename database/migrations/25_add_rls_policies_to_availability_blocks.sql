-- Migración: Agregar políticas RLS a availability_blocks
-- Propósito: Permitir que los profesionales gestionen sus propios bloqueos de disponibilidad

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can insert own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can update own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can delete own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Admins can view all availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Admins can manage all availability blocks" ON public.availability_blocks;

-- 3. Políticas para usuarios regulares (profesionales)
-- Los usuarios solo pueden ver sus propios bloqueos
CREATE POLICY "Users can view own availability blocks" 
ON public.availability_blocks
FOR SELECT 
USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar sus propios bloqueos
CREATE POLICY "Users can insert own availability blocks" 
ON public.availability_blocks
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propios bloqueos
CREATE POLICY "Users can update own availability blocks" 
ON public.availability_blocks
FOR UPDATE 
USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propios bloqueos
CREATE POLICY "Users can delete own availability blocks" 
ON public.availability_blocks
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Políticas para administradores
-- Los admins pueden ver todos los bloqueos
CREATE POLICY "Admins can view all availability blocks" 
ON public.availability_blocks
FOR SELECT 
USING (
  (auth.jwt()->>'email' = 'holistia.io@gmail.com')
  OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'type' = 'admin' 
      OR auth.users.raw_user_meta_data->>'type' = 'Admin'
    )
  )
);

-- Los admins pueden gestionar todos los bloqueos
CREATE POLICY "Admins can manage all availability blocks" 
ON public.availability_blocks
FOR ALL
USING (
  (auth.jwt()->>'email' = 'holistia.io@gmail.com')
  OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'type' = 'admin' 
      OR auth.users.raw_user_meta_data->>'type' = 'Admin'
    )
  )
);

-- 5. Verificar que se crearon las políticas
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN policyname LIKE '%Admin%' THEN '✅ Admin'
    WHEN policyname LIKE '%User%' THEN '👤 User'
    ELSE '👥 Other'
  END as tipo
FROM pg_policies 
WHERE tablename = 'availability_blocks'
ORDER BY policyname;

-- Comentarios sobre las políticas
COMMENT ON POLICY "Users can view own availability blocks" ON public.availability_blocks 
  IS 'Permite a los usuarios ver solo sus propios bloqueos de disponibilidad';
COMMENT ON POLICY "Users can insert own availability blocks" ON public.availability_blocks 
  IS 'Permite a los usuarios crear sus propios bloqueos de disponibilidad';
COMMENT ON POLICY "Users can update own availability blocks" ON public.availability_blocks 
  IS 'Permite a los usuarios actualizar sus propios bloqueos de disponibilidad';
COMMENT ON POLICY "Users can delete own availability blocks" ON public.availability_blocks 
  IS 'Permite a los usuarios eliminar sus propios bloqueos de disponibilidad';
COMMENT ON POLICY "Admins can view all availability blocks" ON public.availability_blocks 
  IS 'Permite a los administradores ver todos los bloqueos de disponibilidad';
COMMENT ON POLICY "Admins can manage all availability blocks" ON public.availability_blocks 
  IS 'Permite a los administradores gestionar todos los bloqueos de disponibilidad';

