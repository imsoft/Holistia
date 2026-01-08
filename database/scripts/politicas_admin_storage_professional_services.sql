-- ============================================================================
-- POLÍTICAS DE STORAGE PARA ADMINS - PROFESSIONAL SERVICES
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → Storage → professional-services → Policies
-- 2. Para cada política, haz clic en "New policy" → "Create a policy from scratch"
-- 3. Copia y pega la configuración de cada política
-- ============================================================================

-- ============================================================================
-- POLÍTICA 1: Admins can upload service images
-- ============================================================================
-- Policy name: Admins can upload service images
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
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
-- Policy name: Admins can update service images
-- Allowed operation: UPDATE
-- Target roles: authenticated
-- USING expression:
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
-- WITH CHECK expression (mismo que USING):
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
-- Policy name: Admins can delete service images
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression:
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
