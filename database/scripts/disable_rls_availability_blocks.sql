-- Script SQL para deshabilitar RLS en availability_blocks
-- Ejecutar este script cuando la base de datos esté en modo de escritura

-- Deshabilitar RLS en la tabla availability_blocks
ALTER TABLE public.availability_blocks DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can insert own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can update own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can delete own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Admins can manage all availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Patients can view professional availability blocks" ON public.availability_blocks;

-- Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'availability_blocks';

-- Verificar que no hay políticas activas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'availability_blocks';

-- Probar que se pueden leer todos los bloqueos
SELECT 
  id,
  professional_id,
  title,
  block_type,
  start_date,
  end_date,
  start_time,
  end_time,
  is_recurring
FROM public.availability_blocks
ORDER BY professional_id, start_date;
