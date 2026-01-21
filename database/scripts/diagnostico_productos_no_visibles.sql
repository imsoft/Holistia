-- ============================================================================
-- DIAGNÓSTICO: Productos digitales que no aparecen en la página de exploración
-- ============================================================================

-- 1. Ver productos activos que NO deberían ser visibles por RLS
SELECT 
    dp.id as producto_id,
    dp.title,
    dp.is_active as producto_activo,
    dp.created_at as producto_creado,
    pa.id as profesional_id,
    pa.first_name || ' ' || pa.last_name as profesional_nombre,
    pa.email as profesional_email,
    pa.status as profesional_status,
    pa.is_verified as profesional_verificado,
    pa.is_active as profesional_activo,
    CASE 
        WHEN pa.status != 'approved' THEN '❌ Profesional NO aprobado'
        WHEN pa.is_verified = false THEN '❌ Profesional NO verificado'
        WHEN pa.is_active = false THEN '❌ Profesional inactivo'
        WHEN dp.is_active = false THEN '❌ Producto inactivo'
        ELSE '✅ Debería ser visible'
    END as motivo_no_visible
FROM digital_products dp
JOIN professional_applications pa ON dp.professional_id = pa.id
WHERE dp.is_active = true
  AND (
    pa.status != 'approved' 
    OR pa.is_verified = false 
    OR pa.is_active = false
  )
ORDER BY dp.created_at DESC;

-- 2. Contar productos por estado del profesional
SELECT 
    CASE 
        WHEN pa.status = 'approved' AND pa.is_verified = true AND pa.is_active = true THEN '✅ Visible'
        WHEN pa.status != 'approved' THEN '❌ Profesional NO aprobado'
        WHEN pa.is_verified = false THEN '❌ Profesional NO verificado'
        WHEN pa.is_active = false THEN '❌ Profesional inactivo'
        ELSE '❓ Otro problema'
    END as estado_visibilidad,
    COUNT(*) as cantidad_productos
FROM digital_products dp
JOIN professional_applications pa ON dp.professional_id = pa.id
WHERE dp.is_active = true
GROUP BY 
    CASE 
        WHEN pa.status = 'approved' AND pa.is_verified = true AND pa.is_active = true THEN '✅ Visible'
        WHEN pa.status != 'approved' THEN '❌ Profesional NO aprobado'
        WHEN pa.is_verified = false THEN '❌ Profesional NO verificado'
        WHEN pa.is_active = false THEN '❌ Profesional inactivo'
        ELSE '❓ Otro problema'
    END
ORDER BY cantidad_productos DESC;

-- 3. Ver todos los productos activos recientes (últimos 10)
SELECT 
    dp.id,
    dp.title,
    dp.is_active,
    dp.created_at,
    pa.first_name || ' ' || pa.last_name as profesional,
    pa.status,
    pa.is_verified,
    pa.is_active as profesional_activo
FROM digital_products dp
JOIN professional_applications pa ON dp.professional_id = pa.id
WHERE dp.is_active = true
ORDER BY dp.created_at DESC
LIMIT 10;
