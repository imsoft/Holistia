-- Script de verificación para el sistema de gamificación de retos
-- Ejecuta este script después de la migración 145 para verificar que todo se creó correctamente

-- ============================================================================
-- 1. VERIFICAR TABLAS
-- ============================================================================

SELECT 
    'Tablas creadas:' as verificacion,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'challenge_checkins',
    'challenge_progress',
    'challenge_badges',
    'challenge_user_badges'
);

-- Mostrar estructura de tablas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'challenge_checkins',
    'challenge_progress',
    'challenge_badges',
    'challenge_user_badges'
)
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 2. VERIFICAR FUNCIONES
-- ============================================================================

SELECT 
    'Funciones creadas:' as verificacion,
    routine_name as nombre_funcion
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'calculate_checkin_points',
    'calculate_level_from_points',
    'check_and_unlock_badges'
)
ORDER BY routine_name;

-- ============================================================================
-- 3. VERIFICAR TRIGGERS
-- ============================================================================

SELECT 
    'Triggers creados:' as verificacion,
    trigger_name as nombre_trigger,
    event_object_table as tabla
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
    'trigger_update_progress_on_checkin',
    'trigger_check_badges_after_progress'
)
ORDER BY trigger_name;

-- ============================================================================
-- 4. VERIFICAR BADGES PREDEFINIDOS
-- ============================================================================

SELECT 
    'Badges predefinidos:' as verificacion,
    COUNT(*) as total_badges
FROM public.challenge_badges
WHERE challenge_id IS NULL; -- Badges globales

-- Mostrar badges globales
SELECT 
    badge_name,
    badge_type,
    requirement_type,
    requirement_value,
    points_reward,
    is_active
FROM public.challenge_badges
WHERE challenge_id IS NULL
ORDER BY display_order;

-- ============================================================================
-- 5. VERIFICAR POLÍTICAS RLS
-- ============================================================================

SELECT 
    'Políticas RLS:' as verificacion,
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'challenge_checkins',
    'challenge_progress',
    'challenge_badges',
    'challenge_user_badges'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. VERIFICAR ÍNDICES
-- ============================================================================

SELECT 
    'Índices creados:' as verificacion,
    indexname as nombre_indice,
    tablename as tabla
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_challenge_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. PROBAR FUNCIÓN DE CÁLCULO DE PUNTOS
-- ============================================================================

SELECT 
    'Prueba calculate_checkin_points:' as verificacion,
    calculate_checkin_points('text', false, 0) as solo_texto,
    calculate_checkin_points('photo', true, 3) as foto_con_racha_3,
    calculate_checkin_points('video', true, 7) as video_con_racha_7,
    calculate_checkin_points('audio', true, 14) as audio_con_racha_14;

-- ============================================================================
-- 8. PROBAR FUNCIÓN DE CÁLCULO DE NIVEL
-- ============================================================================

SELECT 
    'Prueba calculate_level_from_points:' as verificacion,
    calculate_level_from_points(0) as nivel_0_puntos,
    calculate_level_from_points(50) as nivel_50_puntos,
    calculate_level_from_points(100) as nivel_100_puntos,
    calculate_level_from_points(250) as nivel_250_puntos,
    calculate_level_from_points(500) as nivel_500_puntos;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT 
    '✅ Verificación completada' as estado,
    'Si todos los checks muestran datos, la migración fue exitosa' as mensaje;
