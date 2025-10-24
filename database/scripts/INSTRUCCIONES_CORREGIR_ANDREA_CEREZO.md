# Corrección Completa para Andrea Cerezo

## 📋 Problema

Andrea Cerezo ve todo en **0** en su dashboard:
- ❌ Citas Hoy: 0
- ❌ Pacientes Activos: 0  
- ❌ Ingresos del Mes: $0

Y solo ve 1 cita cuando tiene 2 programadas.

## 🔍 Causa

Hay 3 problemas:

1. **Cita del 22 de octubre** tiene un `professional_id` incorrecto (es un `user_id`)
2. **Cita del 28 de octubre** tiene un pago en estado `processing` (no `succeeded`)
3. **Cita del 22 de octubre** no tiene registro de pago

El dashboard **solo cuenta citas con pagos exitosos** (`status = 'succeeded'`), por eso todo aparece en 0.

## ✅ Solución (3 scripts en orden)

### Script 1: Aplicar migración de RLS (Si aún no lo hiciste)

**Archivo:** `database/migrations/57_fix_professionals_appointments_rls.sql`

**¿Por qué?** Crea la vista `professional_patient_info` necesaria para que los profesionales vean las citas.

**Cómo ejecutar:**
1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido del archivo `57_fix_professionals_appointments_rls.sql`
3. Pega y ejecuta

---

### Script 2: Corregir professional_id de la cita

**Archivo:** `database/scripts/fix_andrea_cerezo_appointment.sql`

**¿Qué hace?** Corrige el `professional_id` de la cita del 22 de octubre.

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- Corregir el professional_id
UPDATE appointments
SET 
  professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2',
  updated_at = NOW()
WHERE id = '863d9ef3-7a11-4151-95cb-215c61df025d';

-- Verificar
SELECT 
  a.id,
  a.appointment_date,
  a.professional_id,
  pa.first_name || ' ' || pa.last_name as profesional
FROM appointments a
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE a.id = '863d9ef3-7a11-4151-95cb-215c61df025d';
```

**Resultado esperado:** Debería mostrar "Andrea Cerezo" como profesional.

---

### Script 3: Crear/Actualizar pagos

**Archivo:** `database/scripts/fix_andrea_cerezo_payments.sql`

**¿Qué hace?** 
- Actualiza el pago existente de `processing` a `succeeded`
- Crea un nuevo pago para la cita que no tiene

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- 1. Actualizar pago existente (Cita del 28 de octubre)
UPDATE payments
SET 
  status = 'succeeded',
  paid_at = NOW(),
  updated_at = NOW()
WHERE id = '17e568b5-950a-4983-abee-94e4bcd8a970';

-- 2. Crear pago para cita del 22 de octubre
INSERT INTO payments (
  id,
  appointment_id,
  patient_id,
  professional_id,
  amount,
  service_amount,
  commission_percentage,
  platform_fee,
  currency,
  status,
  payment_type,
  description,
  paid_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '863d9ef3-7a11-4151-95cb-215c61df025d',
  'd89373fe-4cf4-4401-a466-0c1efe9a5937',
  '441c1fd3-87c5-4248-a502-381e8e7aacc2',
  700.00,
  700.00,
  15,
  105.00,
  'mxn',
  'succeeded',
  'appointment',
  'Pago externo - Limpia Energética',
  NOW(),
  '2025-10-22 22:36:03.936285+00',
  NOW()
);

-- 3. Verificar que ambas citas tienen pagos exitosos
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.cost,
  p.status as payment_status,
  p.paid_at,
  CASE 
    WHEN p.status = 'succeeded' THEN '✅ CORRECTO'
    ELSE '❌ AÚN PENDIENTE'
  END as resultado
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
ORDER BY a.appointment_date DESC;
```

**Resultado esperado:** Ambas citas deberían mostrar `✅ CORRECTO`.

---

## 🎯 Verificación Final

Después de ejecutar los 3 scripts:

### 1. En Supabase (SQL Editor):

```sql
-- Verificar que las citas estén bien configuradas
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status as cita_status,
  pa.first_name || ' ' || pa.last_name as profesional,
  p.status as pago_status,
  p.amount,
  CASE 
    WHEN p.status = 'succeeded' AND pa.id IS NOT NULL THEN '✅ TODO CORRECTO'
    WHEN p.status IS NULL THEN '❌ Falta pago'
    WHEN pa.id IS NULL THEN '❌ professional_id incorrecto'
    ELSE '⚠️ Revisar'
  END as estado_general
FROM appointments a
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE pa.email = 'andycerezo2492@gmail.com'
ORDER BY a.appointment_date DESC;
```

**Debe mostrar:** `✅ TODO CORRECTO` en ambas filas.

### 2. En el Dashboard de Andrea:

1. Haz **logout** y **login** de nuevo con Andrea
2. Ve al **Dashboard**
3. Deberías ver:
   - ✅ **Citas Hoy**: El número correcto (si hay citas hoy)
   - ✅ **Pacientes Activos**: El número de pacientes únicos
   - ✅ **Ingresos del Mes**: $5,144.00 (suma de ambas citas: $700 + $4,444)
4. Ve a **Citas**
5. Deberías ver **ambas citas** en el listado

---

## 📝 Resumen de Scripts

| # | Archivo | ¿Qué hace? | ¿Cuándo ejecutar? |
|---|---------|------------|-------------------|
| 1 | `57_fix_professionals_appointments_rls.sql` | Crea vista RLS | Solo si aún no se aplicó |
| 2 | `fix_andrea_cerezo_appointment.sql` | Corrige professional_id | **Siempre** |
| 3 | `fix_andrea_cerezo_payments.sql` | Crea/actualiza pagos | **Siempre** |

---

## 🐛 Troubleshooting

### "Error: duplicate key value"
Si al crear el pago dice que ya existe, significa que ya lo ejecutaste. Omite ese paso.

### Las estadísticas siguen en 0
1. Verifica que los pagos tengan `status = 'succeeded'`
2. Haz logout y login de nuevo
3. Refresca la página del dashboard

### Solo aparece 1 cita en lugar de 2
Verifica que ambas citas tengan el mismo `professional_id` correcto.

---

## ✅ Checklist

- [ ] Script 1: Aplicar migración RLS (si no está aplicada)
- [ ] Script 2: Corregir professional_id de la cita
- [ ] Script 3: Crear/actualizar pagos
- [ ] Verificar en SQL que todo esté correcto
- [ ] Logout y login de Andrea
- [ ] Verificar dashboard (estadísticas correctas)
- [ ] Verificar página de citas (aparecen las 2)

---

**Una vez completado, Andrea debería ver todas sus estadísticas correctamente y ambas citas en su listado.** ✅

