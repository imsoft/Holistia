-- ============================================================================
-- Script para asignar un paciente a un profesional
-- ============================================================================
-- Este script crea una cita entre el profesional y el paciente,
-- lo que permite que el profesional vea al paciente en su lista de pacientes
-- ============================================================================

-- Variables (cambiar estos valores según sea necesario)
-- Email del profesional
-- Email del paciente

-- ============================================================================
-- PASO 1: Obtener IDs de usuario y profesional
-- ============================================================================

DO $$
DECLARE
    professional_user_id UUID;
    professional_app_id UUID;
    patient_user_id UUID;
    appointment_id UUID;
BEGIN
    -- Obtener ID del usuario profesional por email
    SELECT id INTO professional_user_id
    FROM auth.users
    WHERE email = 'montserrat.cosilion@outlook.com';
    
    IF professional_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario profesional con email: montserrat.cosilion@outlook.com';
    END IF;
    
    -- Obtener ID de la aplicación profesional
    SELECT id INTO professional_app_id
    FROM public.professional_applications
    WHERE user_id = professional_user_id
    AND status = 'approved';
    
    IF professional_app_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró una aplicación profesional aprobada para el usuario: montserrat.cosilion@outlook.com';
    END IF;
    
    -- Obtener ID del usuario paciente por email
    SELECT id INTO patient_user_id
    FROM auth.users
    WHERE email = 'brangarciaramos@gmail.com';
    
    IF patient_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario paciente con email: brangarciaramos@gmail.com';
    END IF;
    
    -- Verificar que el paciente existe en profiles
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = patient_user_id
        AND type = 'patient'
    ) THEN
        RAISE EXCEPTION 'El usuario % no existe como paciente en la tabla profiles', 'brangarciaramos@gmail.com';
    END IF;
    
    -- ============================================================================
    -- PASO 2: Crear una cita entre el profesional y el paciente
    -- ============================================================================
    -- Esto establecerá la relación y permitirá que el profesional vea al paciente
    
    -- Verificar si ya existe una cita entre ellos
    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE professional_id = professional_app_id
        AND patient_id = patient_user_id
    ) THEN
        RAISE NOTICE 'Ya existe una cita entre este profesional y paciente. No se creará duplicado.';
    ELSE
        -- Crear una cita completada en el pasado para establecer la relación
        INSERT INTO public.appointments (
            patient_id,
            professional_id,
            appointment_date,
            appointment_time,
            duration_minutes,
            appointment_type,
            status,
            cost,
            location,
            notes,
            created_at,
            updated_at
        ) VALUES (
            patient_user_id,
            professional_app_id,
            CURRENT_DATE - INTERVAL '7 days', -- Cita hace 7 días
            '10:00:00',
            50,
            'online',
            'completed',
            0.00,
            'Online',
            'Cita creada automáticamente para establecer relación profesional-paciente',
            NOW(),
            NOW()
        )
        RETURNING id INTO appointment_id;
        
        RAISE NOTICE '✅ Cita creada exitosamente con ID: %', appointment_id;
        RAISE NOTICE '✅ El profesional ahora puede ver al paciente en su lista de pacientes';
    END IF;
    
    -- ============================================================================
    -- PASO 3: Mostrar información de confirmación
    -- ============================================================================
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE LA ASIGNACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Profesional: montserrat.cosilion@outlook.com';
    RAISE NOTICE '  - User ID: %', professional_user_id;
    RAISE NOTICE '  - Professional Application ID: %', professional_app_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Paciente: brangarciaramos@gmail.com';
    RAISE NOTICE '  - User ID: %', patient_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Relación establecida mediante cita en appointments';
    RAISE NOTICE '========================================';
    
END $$;

-- ============================================================================
-- VERIFICACIÓN: Consultar la relación creada
-- ============================================================================

-- Verificar que la relación existe
SELECT 
    p.email AS professional_email,
    pa.id AS professional_app_id,
    pat.email AS patient_email,
    a.id AS appointment_id,
    a.appointment_date,
    a.status,
    a.created_at
FROM public.appointments a
JOIN public.professional_applications pa ON pa.id = a.professional_id
JOIN auth.users p ON p.id = pa.user_id
JOIN auth.users pat ON pat.id = a.patient_id
WHERE p.email = 'montserrat.cosilion@outlook.com'
AND pat.email = 'brangarciaramos@gmail.com'
ORDER BY a.created_at DESC;
