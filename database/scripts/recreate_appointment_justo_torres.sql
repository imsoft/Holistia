-- ============================================
-- RECREAR CITA ELIMINADA
-- ============================================
-- Paciente: Justo Torres (justoytorres@gmail.com)
-- Profesional: Andrea Izchel Cerezo Vazquez (andycerezo2492@gmail.com)
-- Servicio: Limpia Energetica - Presencial
-- Fecha: 22/10/2025 a las 13:00
-- Costo: $700 MXN
-- ============================================

-- Paso 1: Crear la cita
INSERT INTO appointments (
  id,
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
  gen_random_uuid(),
  'd89373fe-4cf4-4401-a466-0c1efe9a5937', -- Justo Torres
  'c47f5a3e-1050-4276-aee7-2a2f3e7c8fea', -- Andrea Izchel (user_id)
  '2025-10-22', -- Fecha: 22 de octubre 2025
  '13:00:00', -- Hora: 1:00 PM
  60, -- Duración: 60 minutos
  'Limpia Energetica', -- Tipo de servicio
  'confirmed', -- Estado: confirmado (ya pagado)
  700.00, -- Costo: $700 MXN
  'Presencial', -- Modalidad: presencial
  'Cita recreada manualmente - pagada previamente por el paciente',
  now(),
  now()
)
RETURNING 
  id as appointment_id,
  patient_id,
  professional_id,
  appointment_date,
  appointment_time,
  appointment_type,
  status,
  cost;

-- ============================================
-- OPCIONAL: Crear registro de pago
-- ============================================
-- Si quieres registrar también el pago en la tabla de payments,
-- primero ejecuta el INSERT de arriba para obtener el appointment_id,
-- luego ejecuta este INSERT reemplazando '<APPOINTMENT_ID>' con el ID real:

/*
INSERT INTO payments (
  id,
  appointment_id,
  patient_id,
  professional_id,
  amount,
  service_amount,
  commission_percentage,
  currency,
  status,
  payment_type,
  description,
  payment_method,
  created_at,
  updated_at,
  paid_at
) VALUES (
  gen_random_uuid(),
  '<APPOINTMENT_ID>', -- Reemplazar con el ID de la cita creada arriba
  'd89373fe-4cf4-4401-a466-0c1efe9a5937', -- Justo Torres
  'c47f5a3e-1050-4276-aee7-2a2f3e7c8fea', -- Andrea Izchel
  700.00, -- Monto total
  700.00, -- Monto del servicio
  0, -- Comisión (ajustar si aplica)
  'MXN',
  'completed', -- Estado: completado
  'appointment', -- Tipo: cita
  'Limpia Energetica - Presencial - Pago recreado',
  'card', -- Método de pago
  now(),
  now(),
  now()
);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esta query para verificar que la cita se creó correctamente:

SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.appointment_type,
  a.status,
  a.cost,
  a.location,
  u_patient.email as patient_email,
  u_patient.raw_user_meta_data->>'first_name' as patient_first_name,
  u_patient.raw_user_meta_data->>'last_name' as patient_last_name,
  pa.first_name as professional_first_name,
  pa.last_name as professional_last_name,
  pa.email as professional_email
FROM appointments a
LEFT JOIN auth.users u_patient ON a.patient_id = u_patient.id
LEFT JOIN professional_applications pa ON a.professional_id = pa.user_id
WHERE a.patient_id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937'
  AND a.professional_id = 'c47f5a3e-1050-4276-aee7-2a2f3e7c8fea'
  AND a.appointment_date = '2025-10-22'
ORDER BY a.created_at DESC;

