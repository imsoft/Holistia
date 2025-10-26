-- ============================================================================
-- Script para verificar permisos de administrador en finanzas
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Diagnosticar por qué el dashboard de finanzas muestra $0
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar políticas RLS en la tabla payments
-- ============================================================================

SELECT 
  '🔍 POLÍTICAS RLS EN PAYMENTS' as seccion,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'payments'
ORDER BY policyname;

-- ============================================================================
-- PASO 2: Verificar políticas RLS en la tabla appointments
-- ============================================================================

SELECT 
  '🔍 POLÍTICAS RLS EN APPOINTMENTS' as seccion,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'appointments'
ORDER BY policyname;

-- ============================================================================
-- PASO 3: Verificar si existen pagos en la base de datos
-- ============================================================================

SELECT 
  '📊 RESUMEN DE PAGOS EN LA BASE DE DATOS' as seccion,
  COUNT(*) as total_pagos,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as pagos_exitosos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pagos_pendientes,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as pagos_fallidos,
  SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as ingresos_totales,
  MIN(created_at) as primer_pago,
  MAX(created_at) as ultimo_pago
FROM payments;

-- ============================================================================
-- PASO 4: Verificar pagos por tipo
-- ============================================================================

SELECT 
  '📈 PAGOS POR TIPO' as seccion,
  payment_type,
  COUNT(*) as cantidad,
  SUM(amount) as total_monto,
  AVG(amount) as promedio_monto
FROM payments
WHERE status = 'succeeded'
GROUP BY payment_type
ORDER BY total_monto DESC;

-- ============================================================================
-- PASO 5: Verificar pagos del mes actual
-- ============================================================================

SELECT 
  '📅 PAGOS DEL MES ACTUAL' as seccion,
  COUNT(*) as pagos_mes_actual,
  SUM(amount) as ingresos_mes_actual,
  payment_type,
  status
FROM payments
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY payment_type, status
ORDER BY payment_type, status;

-- ============================================================================
-- PASO 6: Verificar usuario administrador actual
-- ============================================================================

SELECT 
  '👤 USUARIO ADMINISTRADOR ACTUAL' as seccion,
  auth.uid() as user_id,
  p.email,
  p.type,
  p.account_active,
  p.first_name,
  p.last_name
FROM profiles p
WHERE p.id = auth.uid();

-- ============================================================================
-- PASO 7: Probar acceso directo a la tabla payments (como admin)
-- ============================================================================

-- Este query debería funcionar si el admin tiene permisos
SELECT 
  '🧪 PRUEBA DE ACCESO A PAYMENTS' as test,
  COUNT(*) as total_registros,
  'Si ves un número > 0, el admin tiene acceso' as resultado
FROM payments;

-- ============================================================================
-- PASO 8: Verificar si hay datos de appointments
-- ============================================================================

SELECT 
  '📅 RESUMEN DE APPOINTMENTS' as seccion,
  COUNT(*) as total_citas,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as citas_confirmadas,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as citas_completadas,
  MIN(appointment_date) as primera_cita,
  MAX(appointment_date) as ultima_cita
FROM appointments;

-- ============================================================================
-- DIAGNÓSTICO AUTOMÁTICO
-- ============================================================================

-- Verificar si las políticas de admin existen
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'payments' 
        AND policyname = 'Admins can view all payments'
    ) THEN '✅ Política de admin para payments existe'
    ELSE '❌ FALTA: Política de admin para payments'
  END as estado_payments_policy;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'appointments' 
        AND policyname = 'Admins can view all appointments'
    ) THEN '✅ Política de admin para appointments existe'
    ELSE '❌ FALTA: Política de admin para appointments'
  END as estado_appointments_policy;

-- ============================================================================
-- INSTRUCCIONES DE SOLUCIÓN
-- ============================================================================

SELECT 
  '🔧 SOLUCIÓN REQUERIDA' as instrucciones,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'payments' 
        AND policyname = 'Admins can view all payments'
    ) THEN '1. Aplicar migración 74_admin_can_read_appointments_and_payments.sql'
    ELSE '1. ✅ Políticas de admin ya aplicadas'
  END as paso_1,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM payments) = 0 THEN '2. ⚠️ No hay pagos en la base de datos - esto es normal si no hay transacciones'
    ELSE '2. ✅ Hay pagos en la base de datos'
  END as paso_2,
  
  '3. Verificar que el usuario esté logueado como admin' as paso_3,
  '4. Refrescar la página de finanzas después de aplicar las políticas' as paso_4;
