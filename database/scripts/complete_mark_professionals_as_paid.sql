-- Script Completo: Verificar y Marcar Profesionales como Pagados
-- Fecha: 2025-10-27
-- Descripción: Script completo que verifica la existencia de los profesionales
--              y los marca como que ya pagaron la cuota de inscripción

-- ========================================
-- PASO 1: VERIFICACIÓN
-- ========================================

-- Verificar que los profesionales existen
DO $$
DECLARE
    cyntia_exists BOOLEAN;
    esmeralda_exists BOOLEAN;
BEGIN
    -- Verificar Cyntia Flores
    SELECT EXISTS(
        SELECT 1 FROM professional_applications 
        WHERE email = 'florescyntia09@gmail.com'
        AND first_name = 'Cyntia'
        AND last_name = 'Flores'
    ) INTO cyntia_exists;
    
    -- Verificar Esmeralda Garcia
    SELECT EXISTS(
        SELECT 1 FROM professional_applications 
        WHERE email = 'malama.espaciocreativo@gmail.com'
        AND first_name = 'Esmeralda'
        AND last_name = 'Garcia'
    ) INTO esmeralda_exists;
    
    -- Mostrar resultados de verificación
    RAISE NOTICE 'Verificación de profesionales:';
    RAISE NOTICE 'Cyntia Flores existe: %', cyntia_exists;
    RAISE NOTICE 'Esmeralda Garcia existe: %', esmeralda_exists;
    
    -- Continuar solo si ambos existen
    IF NOT (cyntia_exists AND esmeralda_exists) THEN
        RAISE EXCEPTION 'No se encontraron todos los profesionales requeridos. Verifica los datos.';
    END IF;
END $$;

-- ========================================
-- PASO 2: ACTUALIZACIÓN
-- ========================================

-- Actualizar Cyntia Flores
UPDATE professional_applications 
SET 
    registration_fee_paid = TRUE,
    registration_fee_amount = 1000.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE email = 'florescyntia09@gmail.com'
AND first_name = 'Cyntia'
AND last_name = 'Flores';

-- Verificar actualización de Cyntia
DO $$
DECLARE
    cyntia_updated INTEGER;
BEGIN
    GET DIAGNOSTICS cyntia_updated = ROW_COUNT;
    RAISE NOTICE 'Cyntia Flores actualizada: % filas', cyntia_updated;
END $$;

-- Actualizar Esmeralda Garcia
UPDATE professional_applications 
SET 
    registration_fee_paid = TRUE,
    registration_fee_amount = 1000.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE email = 'malama.espaciocreativo@gmail.com'
AND first_name = 'Esmeralda'
AND last_name = 'Garcia';

-- Verificar actualización de Esmeralda
DO $$
DECLARE
    esmeralda_updated INTEGER;
BEGIN
    GET DIAGNOSTICS esmeralda_updated = ROW_COUNT;
    RAISE NOTICE 'Esmeralda Garcia actualizada: % filas', esmeralda_updated;
END $$;

-- ========================================
-- PASO 3: VERIFICACIÓN FINAL
-- ========================================

-- Mostrar el estado final de los profesionales actualizados
SELECT 
    'RESULTADO FINAL' as estado,
    pa.id,
    pa.user_id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.status,
    pa.registration_fee_paid,
    pa.registration_fee_amount,
    pa.registration_fee_currency,
    pa.registration_fee_paid_at,
    pa.updated_at
FROM professional_applications pa
WHERE pa.email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
)
ORDER BY pa.first_name, pa.last_name;

-- Resumen final
SELECT 
    'RESUMEN FINAL' as tipo,
    COUNT(*) as total_professionals,
    SUM(CASE WHEN registration_fee_paid = TRUE THEN 1 ELSE 0 END) as paid_professionals,
    SUM(CASE WHEN registration_fee_paid = FALSE THEN 1 ELSE 0 END) as unpaid_professionals,
    STRING_AGG(
        CONCAT(first_name, ' ', last_name, ' (', email, ')'), 
        ', '
    ) as updated_professionals
FROM professional_applications 
WHERE email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SCRIPT COMPLETADO EXITOSAMENTE';
    RAISE NOTICE 'Los profesionales han sido marcados como pagados';
    RAISE NOTICE '========================================';
END $$;
