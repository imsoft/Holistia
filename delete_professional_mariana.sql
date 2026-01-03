-- Script para eliminar todos los datos del profesional Mariana Ondarreta
-- user_id: 42abb3f2-772b-48e0-8f16-7081330ee180
-- professional_application_id: cf049fd9-dd98-4fa5-acf5-9e811f4a049b
-- Email: holisticobymariana@gmail.com

-- IMPORTANTE: Ejecutar este script en una transacción para poder hacer rollback si es necesario
BEGIN;

-- Declarar variables
DO $$
DECLARE
    v_user_id UUID := '42abb3f2-772b-48e0-8f16-7081330ee180';
    v_professional_id UUID := 'cf049fd9-dd98-4fa5-acf5-9e811f4a049b';
    v_count INTEGER;
BEGIN
    -- 1. Eliminar citas/appointments
    DELETE FROM appointments
    WHERE professional_id = v_professional_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Appointments eliminados: %', v_count;

    -- 2. Eliminar availability_blocks (bloques de disponibilidad)
    DELETE FROM availability_blocks
    WHERE professional_id = v_professional_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Availability blocks eliminados: %', v_count;

    -- 3. Eliminar servicios profesionales
    DELETE FROM professional_services
    WHERE professional_id = v_professional_id OR user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Professional services eliminados: %', v_count;

    -- 4. Eliminar eventos y talleres
    DELETE FROM events_workshops
    WHERE professional_id = v_professional_id OR created_by = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Events workshops eliminados: %', v_count;

    -- 5. Eliminar pagos/payments relacionados
    DELETE FROM payments
    WHERE professional_id = v_professional_id
    OR patient_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Payments eliminados: %', v_count;

    -- 6. Eliminar registros de eventos
    DELETE FROM event_registrations
    WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Event registrations eliminados: %', v_count;

    -- 7. Eliminar favoritos (user_favorites)
    DELETE FROM user_favorites
    WHERE user_id = v_user_id
    OR professional_id = v_professional_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'User favorites eliminados: %', v_count;

    -- 8. Eliminar reviews/reseñas
    DELETE FROM reviews
    WHERE professional_id = v_user_id OR patient_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Reviews eliminados: %', v_count;

    -- 9. Eliminar logs de email
    DELETE FROM email_logs
    WHERE recipient_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Email logs eliminados: %', v_count;

    -- 10. Eliminar aplicación de profesional
    DELETE FROM professional_applications
    WHERE id = v_professional_id
    OR user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Professional application eliminada: %', v_count;

    -- 11. Eliminar perfil de usuario
    DELETE FROM profiles
    WHERE id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Profile eliminado: %', v_count;

    -- 12. Finalmente, eliminar usuario de auth.users (si tienes permisos)
    -- NOTA: Esto requiere permisos especiales y podría necesitar ejecutarse por separado
    -- DELETE FROM auth.users WHERE id = v_user_id;
    -- GET DIAGNOSTICS v_count = ROW_COUNT;
    -- RAISE NOTICE 'Auth user eliminado: %', v_count;

END $$;

-- Si todo está correcto, hacer COMMIT
-- Si hay algún error o quieres revisar primero, hacer ROLLBACK
COMMIT;
-- ROLLBACK;  -- Descomentar esta línea si quieres revertir los cambios


-- ========================================
-- VERIFICACIÓN POST-ELIMINACIÓN
-- ========================================
-- Ejecutar estas queries después para verificar que todo se eliminó:

-- Verificar appointments
SELECT COUNT(*) as appointments_count
FROM appointments
WHERE professional_id = 'cf049fd9-dd98-4fa5-acf5-9e811f4a049b';

-- Verificar professional_applications
SELECT COUNT(*) as professional_apps_count
FROM professional_applications
WHERE id = 'cf049fd9-dd98-4fa5-acf5-9e811f4a049b'
OR user_id = '42abb3f2-772b-48e0-8f16-7081330ee180';

-- Verificar profiles
SELECT COUNT(*) as profiles_count
FROM profiles
WHERE id = '42abb3f2-772b-48e0-8f16-7081330ee180';

-- Verificar auth.users (si tienes permisos para consultarlo)
-- SELECT COUNT(*) as auth_users_count
-- FROM auth.users
-- WHERE id = '42abb3f2-772b-48e0-8f16-7081330ee180';
