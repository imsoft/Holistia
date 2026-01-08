-- ============================================================================
-- ⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️
-- ============================================================================
-- ESTE ARCHIVO NO ES UN SCRIPT SQL EJECUTABLE
-- NO LO EJECUTES EN EL SQL EDITOR - CAUSARÁ ERRORES DE SINTAXIS
-- ============================================================================
-- 
-- Este archivo es SOLO una REFERENCIA con las expresiones SQL que debes
-- COPIAR Y PEGAR en el Dashboard de Supabase al crear las políticas.
-- 
-- INSTRUCCIONES CORRECTAS:
-- 1. Abre este archivo para ver las expresiones SQL
-- 2. Ve a Supabase Dashboard → Storage → professional-services → Policies
-- 3. Crea cada política manualmente desde el Dashboard
-- 4. Copia SOLO las expresiones SQL (sin los comentarios) y pégala en el Dashboard
-- 
-- NO copies todo el archivo al SQL Editor - solo las expresiones individuales
-- ============================================================================

-- ============================================================================
-- POLÍTICAS DE STORAGE PARA ADMINS - PROFESSIONAL SERVICES
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → Storage → professional-services → Policies
-- 2. Para cada política, haz clic en "New policy" → "Create a policy from scratch"
-- 3. Copia SOLO la expresión SQL (no los comentarios) y pégala en el campo correspondiente
-- ============================================================================

-- ============================================================================
-- POLÍTICA 1: Admins can upload service images
-- ============================================================================
-- Configuración en Dashboard:
--   Policy name: Admins can upload service images
--   Allowed operation: INSERT
--   Target roles: authenticated
--   WITH CHECK expression (copia SOLO esto):
-- ============================================================================
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)

-- ============================================================================
-- POLÍTICA 2: Admins can update service images
-- ============================================================================
-- Configuración en Dashboard:
--   Policy name: Admins can update service images
--   Allowed operation: UPDATE
--   Target roles: authenticated
--   USING expression (copia SOLO esto):
-- ============================================================================
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
-- WITH CHECK expression (copia lo mismo que USING):
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)

-- ============================================================================
-- POLÍTICA 3: Admins can delete service images
-- ============================================================================
-- Configuración en Dashboard:
--   Policy name: Admins can delete service images
--   Allowed operation: DELETE
--   Target roles: authenticated
--   USING expression (copia SOLO esto):
-- ============================================================================
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)

-- ============================================================================
-- RESUMEN
-- ============================================================================
-- Después de crear estas 3 políticas, tendrás 7 políticas en total:
-- 1. Public can view service images (SELECT)
-- 2. Professionals can upload service images (INSERT)
-- 3. Professionals can update service images (UPDATE)
-- 4. Professionals can delete service images (DELETE)
-- 5. Admins can upload service images (INSERT) ← NUEVA
-- 6. Admins can update service images (UPDATE) ← NUEVA
-- 7. Admins can delete service images (DELETE) ← NUEVA
-- ============================================================================
