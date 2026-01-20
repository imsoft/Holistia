-- ============================================================================
-- DIAGNÓSTICO: Servicios que parecen eliminados o no visibles
-- ============================================================================

-- 1. Ver TODOS los servicios (activos e inactivos) ordenados por fecha
SELECT 
    ps.id,
    ps.name,
    ps.isactive,
    ps.professional_id,
    ps.user_id,
    ps.created_at,
    ps.updated_at,
    pa.first_name || ' ' || pa.last_name as profesional_nombre,
    pa.email as profesional_email
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
ORDER BY ps.updated_at DESC
LIMIT 50;

-- 2. Servicios que fueron actualizados recientemente (últimos 7 días)
SELECT 
    ps.id,
    ps.name,
    ps.isactive,
    ps.modality,
    ps.cost,
    ps.pricing_type,
    ps.created_at,
    ps.updated_at,
    pa.first_name || ' ' || pa.last_name as profesional
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.updated_at > NOW() - INTERVAL '7 days'
ORDER BY ps.updated_at DESC;

-- 3. Contar servicios por estado (activo/inactivo)
SELECT 
    isactive,
    COUNT(*) as cantidad
FROM professional_services
GROUP BY isactive;

-- 4. Servicios INACTIVOS (podrían parecer "eliminados" pero solo están desactivados)
SELECT 
    ps.id,
    ps.name,
    ps.created_at,
    ps.updated_at,
    pa.first_name || ' ' || pa.last_name as profesional,
    pa.email
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.isactive = false
ORDER BY ps.updated_at DESC;

-- 5. Verificar si hay servicios donde professional_id no coincide con ningún profesional
SELECT 
    ps.id,
    ps.name,
    ps.professional_id,
    ps.user_id
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE pa.id IS NULL;

-- 6. Verificar servicios por profesional específico (reemplaza el email)
-- SELECT 
--     ps.id,
--     ps.name,
--     ps.isactive,
--     ps.created_at,
--     ps.updated_at
-- FROM professional_services ps
-- JOIN professional_applications pa ON ps.professional_id = pa.id
-- WHERE pa.email = 'email@del-profesional.com'
-- ORDER BY ps.updated_at DESC;

-- 7. Ver el historial de cambios en updated_at vs created_at
-- (servicios que fueron modificados después de crearse)
SELECT 
    ps.id,
    ps.name,
    ps.isactive,
    ps.created_at,
    ps.updated_at,
    (ps.updated_at - ps.created_at) as tiempo_desde_creacion,
    pa.first_name || ' ' || pa.last_name as profesional
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.updated_at > ps.created_at + INTERVAL '1 minute'
ORDER BY ps.updated_at DESC
LIMIT 20;
