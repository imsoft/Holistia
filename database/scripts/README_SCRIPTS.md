# Scripts de Diagnóstico y Corrección

## 📋 Scripts Disponibles

### 1. **diagnostico_supabase.sql** ⭐ RECOMENDADO

**✅ Compatible con Supabase SQL Editor**

**¿Qué hace?**
- Detecta citas sin registro de pago
- Detecta pagos con estado incorrecto
- Detecta professional_id inválidos
- Muestra resumen de problemas
- Lista profesionales afectados

**Cómo usar:**
1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** → **New Query**
3. Copia y pega el contenido de `diagnostico_supabase.sql`
4. Haz clic en **Run** o presiona `Cmd/Ctrl + Enter`
5. Revisa los resultados

**Ejecutar este script NO modifica nada**, solo diagnostica.

---

### 2. **correccion_automatica.sql** ⚠️ MODIFICA DATOS

**✅ Compatible con Supabase SQL Editor**

**¿Qué hace?**
- Crea pagos faltantes automáticamente
- Actualiza pagos a estado `succeeded`
- Verifica que todo quedó correcto

**Cómo usar:**
1. **Ejecuta primero el diagnóstico** para saber qué problemas hay
2. Abre Supabase SQL Editor
3. Copia y pega el contenido de `correccion_automatica.sql`
4. Haz clic en **Run**
5. Ejecuta el diagnóstico de nuevo para verificar

**⚠️ ADVERTENCIA:** Este script **SÍ modifica datos** en tu base de datos.

---

---

## 🚀 Flujo Recomendado

### Paso 1: Diagnosticar
```sql
-- Ejecuta en Supabase SQL Editor:
-- database/scripts/diagnostico_supabase.sql
```

**¿Qué buscar?**
- Si dice **0** en todos los problemas → ✅ Todo bien, no necesitas hacer nada
- Si encuentra problemas → Continúa al Paso 2

### Paso 2: Revisar Resultados

El diagnóstico te mostrará:
- **Cuántas** citas tienen problemas
- **Qué** profesionales están afectados
- **Qué tipo** de problemas hay

### Paso 3: (Opcional) Corregir Automáticamente

Si quieres corregir los problemas automáticamente:
```sql
-- Ejecuta en Supabase SQL Editor:
-- database/scripts/correccion_automatica.sql
```

### Paso 4: Verificar

Ejecuta el diagnóstico de nuevo para confirmar que todo se corrigió.

---

## 📊 Interpretando los Resultados

### Sin Problemas ✅
```
tipo_problema          | cantidad
-----------------------|----------
Sin pago registrado    | 0
Pago no exitoso        | 0
professional_id inv... | 0
```
**Acción:** Ninguna, el sistema está sano.

### Con Problemas ⚠️
```
tipo_problema          | cantidad
-----------------------|----------
Sin pago registrado    | 5
Pago no exitoso        | 2
professional_id inv... | 0
```
**Acción:** Ejecuta `correccion_automatica.sql` o corrígelos manualmente.

---

## 🔧 Corrección Manual (Alternativa)

Si prefieres corregir manualmente en lugar de usar el script automático:

### Crear un pago faltante:
```sql
INSERT INTO payments (
  id, appointment_id, patient_id, professional_id,
  amount, service_amount, commission_percentage, platform_fee,
  currency, status, payment_type, description,
  paid_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'appointment_id_aqui',
  'patient_id_aqui',
  'professional_id_aqui',
  1000.00, 1000.00, 15, 150.00,
  'mxn', 'succeeded', 'appointment',
  'Pago externo registrado',
  NOW(), NOW(), NOW()
);
```

### Actualizar un pago a succeeded:
```sql
UPDATE payments
SET 
  status = 'succeeded',
  paid_at = NOW(),
  updated_at = NOW()
WHERE id = 'payment_id_aqui';
```

### Corregir professional_id:
```sql
UPDATE appointments
SET 
  professional_id = 'professional_id_correcto',
  updated_at = NOW()
WHERE id = 'appointment_id_aqui';
```

---

## 📅 Mantenimiento Recomendado

### Mensual:
1. Ejecuta `diagnostico_supabase.sql`
2. Si encuentra problemas, investiga por qué ocurrieron
3. Aplica corrección si es necesario

### Después de crear citas manualmente:
1. Asegúrate de crear el pago correspondiente
2. Verifica que el `professional_id` sea correcto
3. Ejecuta diagnóstico para confirmar

---

## 🐛 Troubleshooting

### "Syntax error at or near \echo"
**Problema:** Estás usando el script legacy en Supabase.
**Solución:** Usa `diagnostico_supabase.sql` en su lugar.

### "No se crearon pagos"
**Problema:** No hay citas con problemas.
**Solución:** Todo está bien, no necesitas hacer nada.

### "Error: duplicate key value"
**Problema:** Ya existe un pago para esa cita.
**Solución:** Actualiza el existente en lugar de crear uno nuevo.

---

## 📝 Scripts por Profesional

Si necesitas scripts específicos para un profesional:

- `fix_andrea_cerezo_appointment.sql` - Corrige cita de Andrea Cerezo
- `fix_andrea_cerezo_payments.sql` - Crea/actualiza pagos de Andrea
- `fix_andrea_complete.sql` - Corrección completa de Andrea
- `marcar_pago_externo_lili_ruiz.sql` - Marca inscripción de Lili Ruiz
- `marcar_pago_externo_maria_gomez.sql` - Marca inscripción de María Gómez
- `mark_brenda_rodriguez_as_paid.sql` - Marca pago de Brenda Rodríguez
- `mark_aura_stephany_brenda_as_paid.sql` - Marca pagos de varios profesionales
- `mark_external_payments.sql` - Marca pagos externos de varios profesionales
- `complete_mark_professionals_as_paid.sql` - Script completo para marcar profesionales como pagados

**Nota:** Estos scripts son para casos específicos. Para problemas generales, usa los scripts universales (`diagnostico_supabase.sql` y `correccion_automatica.sql`).

## 🔧 Scripts de Utilidad

- `create_get_professional_availability_blocks_function.sql` - Crea función RPC para obtener bloqueos de disponibilidad
- `security_audit.sql` - Auditoría completa de seguridad
- `security_audit_simple.sql` - Auditoría simple de seguridad
- `pre_migration_stats.sql` - Estadísticas antes de migraciones
- `find_remaining_policies.sql` - Encuentra políticas restantes
- `cleanup_orphan_restaurant_center_images.sql` - Limpia imágenes huérfanas
- `fix_payment_dates_2024.sql` - Corrige fechas de pagos de 2024
- `corregir_fechas_pagos_2025.sql` - Corrige fechas de pagos de 2025

---

## ✅ Checklist

Antes de ejecutar correcciones:
- [ ] Ejecuté el diagnóstico primero
- [ ] Revisé qué problemas encontró
- [ ] Entiendo qué va a cambiar
- [ ] Tengo backup (opcional, pero recomendado)
- [ ] Ejecuto corrección
- [ ] Verifico con diagnóstico nuevamente

---

**¿Necesitas ayuda?** Revisa la documentación completa en:
- `docs/SOLUCION_ROBUSTA_DASHBOARD.md`
- `database/scripts/INSTRUCCIONES_CORREGIR_ANDREA_CEREZO.md`

