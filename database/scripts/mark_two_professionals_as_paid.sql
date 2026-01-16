-- Script: Marcar como pagadas las inscripciones de dos profesionales específicas
-- Fecha: 2026-01-16
-- Descripción: Marca como pagadas las inscripciones de:
--   1. Rocío Citlalli Espinoza Morquecho (rociocitlalli27@gmail.com)
--   2. Ana Cristina Serrano Olivares (4nacserrano@gmail.com)

-- Verificar que las profesionales existen antes de actualizar
DO $$
DECLARE
  rocio_id UUID;
  ana_id UUID;
  rocio_name TEXT;
  ana_name TEXT;
BEGIN
  -- Buscar a Rocío Citlalli Espinoza Morquecho
  SELECT id, first_name || ' ' || last_name INTO rocio_id, rocio_name
  FROM professional_applications
  WHERE email = 'rociocitlalli27@gmail.com'
  LIMIT 1;

  -- Buscar a Ana Cristina Serrano Olivares
  SELECT id, first_name || ' ' || last_name INTO ana_id, ana_name
  FROM professional_applications
  WHERE email = '4nacserrano@gmail.com'
  LIMIT 1;

  -- Verificar que ambas existen
  IF rocio_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró a Rocío Citlalli Espinoza Morquecho con email rociocitlalli27@gmail.com';
  END IF;

  IF ana_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró a Ana Cristina Serrano Olivares con email 4nacserrano@gmail.com';
  END IF;

  -- Mostrar información antes de actualizar
  RAISE NOTICE 'Profesionales encontradas:';
  RAISE NOTICE '  - % (ID: %)', rocio_name, rocio_id;
  RAISE NOTICE '  - % (ID: %)', ana_name, ana_id;

  -- Actualizar a Rocío Citlalli Espinoza Morquecho
  UPDATE professional_applications
  SET 
    registration_fee_paid = TRUE,
    registration_fee_paid_at = NOW(),
    registration_fee_expires_at = NOW() + INTERVAL '1 year',
    registration_fee_amount = 888.00,
    registration_fee_currency = 'mxn'
  WHERE id = rocio_id;

  RAISE NOTICE '✓ Inscripción marcada como pagada para: %', rocio_name;

  -- Actualizar a Ana Cristina Serrano Olivares
  UPDATE professional_applications
  SET 
    registration_fee_paid = TRUE,
    registration_fee_paid_at = NOW(),
    registration_fee_expires_at = NOW() + INTERVAL '1 year',
    registration_fee_amount = 888.00,
    registration_fee_currency = 'mxn'
  WHERE id = ana_id;

  RAISE NOTICE '✓ Inscripción marcada como pagada para: %', ana_name;

  RAISE NOTICE '✅ Script completado exitosamente. Ambas profesionales ahora tienen su inscripción marcada como pagada.';
END $$;

-- Verificar los resultados
SELECT 
  id,
  first_name || ' ' || last_name AS nombre_completo,
  email,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  registration_fee_amount,
  registration_fee_currency
FROM professional_applications
WHERE email IN ('rociocitlalli27@gmail.com', '4nacserrano@gmail.com')
ORDER BY email;
