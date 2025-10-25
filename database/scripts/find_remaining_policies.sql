-- ============================================================================
-- SCRIPT: Encontrar políticas que aún usan auth.users.raw_user_meta_data
-- ============================================================================

SELECT 
  '⚠️  POLÍTICAS PENDIENTES DE ACTUALIZAR' as titulo,
  '' as separador;

-- Encontrar la(s) política(s) que aún usan raw_user_meta_data
SELECT 
  schemaname as schema,
  tablename as tabla,
  policyname as politica,
  cmd as comando,
  qual::text as condicion_using,
  with_check::text as condicion_with_check
FROM pg_policies
WHERE (
  qual::text LIKE '%raw_user_meta_data%' 
  OR with_check::text LIKE '%raw_user_meta_data%'
)
AND schemaname = 'public'
ORDER BY tablename, policyname;

