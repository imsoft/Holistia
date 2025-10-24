# ⚠️ MIGRACIÓN URGENTE: RLS de Payments para Profesionales

## 🐛 Problema Crítico Detectado

**Los profesionales NO pueden ver los pagos de sus citas** porque falta una política RLS.

### Síntomas:
- ✅ Los pagos existen en la base de datos
- ❌ Dashboard muestra $0.00 en ingresos
- ❌ Badges muestran "Sin pago" en citas pagadas
- ❌ Profesionales no pueden consultar tabla `payments`

### Causa Raíz:
La tabla `payments` tiene estas políticas RLS:
- ✅ Admins pueden ver todos los pagos
- ✅ Pacientes pueden ver sus propios pagos
- ✅ Profesionales pueden ver pagos de **eventos**
- ❌ **FALTA**: Profesionales puedan ver pagos de **citas**

---

## 🚀 Solución: Aplicar Migración 60

### Paso 1: Abrir Supabase SQL Editor

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto Holistia
3. Haz clic en **SQL Editor** (menú lateral izquierdo)
4. Haz clic en **New Query**

### Paso 2: Copiar y Ejecutar la Migración

1. Abre el archivo:
   ```
   database/migrations/60_add_professionals_can_view_appointment_payments.sql
   ```

2. Copia **TODO** el contenido del archivo

3. Pégalo en el SQL Editor de Supabase

4. Haz clic en **Run** o presiona `Cmd/Ctrl + Enter`

### Paso 3: Verificar el Resultado

Deberías ver un mensaje como:
```
✅ Política creada correctamente
policyname: Professionals can view payments for their appointments
cmd: SELECT
qual: (...)
```

---

## ✅ Verificación Post-Migración

Después de aplicar la migración:

### 1. Refresca el Dashboard del Profesional

Presiona `Ctrl/Cmd + Shift + R` (hard refresh)

**Debería mostrar:**
- **Ingresos Totales:** $4,372.40
  - (Neto después de comisión 15%)
  - Cálculo: $5,144 × 0.85 = $4,372.40

### 2. Verifica la Página de Citas

Las citas deberían mostrar:
```
[Confirmada] [🟢 Pagado]
```

En lugar de:
```
[Confirmada] [⚠️ Sin pago]
```

---

## 🔍 Si Aún No Funciona

Si después de aplicar la migración aún ves $0.00:

### Verificar que la política se creó:
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'payments'
  AND policyname LIKE '%appointment%';
```

Deberías ver:
```
Professionals can view payments for their appointments | SELECT
```

### Verificar que los pagos son accesibles:
```sql
-- Como admin, verifica que los pagos existan
SELECT 
  p.id,
  p.payment_type,
  p.amount,
  p.status,
  a.professional_id
FROM payments p
INNER JOIN appointments a ON a.id = p.appointment_id
WHERE p.payment_type = 'appointment'
LIMIT 5;
```

---

## 📊 Para Andrea Cerezo Específicamente

Después de aplicar la migración, su dashboard debería mostrar:

| Métrica | Valor Esperado |
|---------|----------------|
| Citas Hoy | 0 (no tiene citas hoy) |
| Pacientes Activos | 1 |
| **Ingresos Totales** | **$4,372.40** |

**Desglose:**
- Cita 1: $4,444.00
- Cita 2: $700.00
- **Total bruto:** $5,144.00
- **Comisión Holistia (15%):** -$771.60
- **Neto para profesional:** **$4,372.40** ✅

---

## 🎯 Otras Migraciones Pendientes

Si aún no las has aplicado, también necesitas:

1. **Migración 57:** `57_fix_professionals_appointments_rls.sql`
   - Para que profesionales puedan ver sus citas
   - Crea la vista `professional_patient_info`

2. **Migración 58:** `58_add_duration_unit_to_events.sql`
   - Agrega unidad de duración a eventos (horas/días)

3. **Migración 59:** `59_add_end_date_time_to_events.sql`
   - Agrega fecha/hora de fin a eventos

---

## ⚠️ IMPORTANTE

Esta migración es **CRÍTICA** y debe aplicarse **INMEDIATAMENTE** para que:
- Los profesionales puedan ver sus ingresos
- Los dashboards funcionen correctamente
- Los badges de pago se muestren bien

**Tiempo estimado:** 30 segundos
**Dificultad:** Baja (solo copiar y pegar)
**Impacto:** ALTO - Arregla el problema de $0.00 en todos los profesionales

---

## 📞 Soporte

Si tienes problemas aplicando esta migración:
1. Verifica que eres admin en Supabase
2. Asegúrate de estar en el proyecto correcto
3. Copia EXACTAMENTE todo el contenido del archivo SQL
4. Si da error, copia el mensaje de error completo

---

**¡Esta es la solución definitiva al problema de los $0.00!** 🎉

