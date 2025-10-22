# Limpieza de Datos Requerida

## Problema Detectado: Citas Huérfanas

### Descripción del Problema
Se detectaron **8 citas** en la tabla `appointments` que tienen `professional_id` que **NO existen** en ninguna parte del sistema:
- No existen en `professional_applications.user_id`
- No existen en `auth.users.id`

Esto causa que:
1. En el panel de administradores, todos los profesionales muestren "0 pacientes"
2. En el panel de usuarios, todos muestren "0 citas"
3. Los datos sean inconsistentes e imposibles de relacionar

### IDs Huérfanos Detectados
Los siguientes `professional_id` en la tabla `appointments` no existen:
- `bd8101ae-2d9e-4cf8-a9a7-927b69e9359c`
- `441c1fd3-87c5-4248-a502-381e8e7aacc2`
- `65d0472b-e4d5-4fbd-bd43-6df023e7d06c`

### Solución: Ejecutar la Migración

La migración `53_clean_orphan_appointments.sql` ya está creada. Para aplicarla:

#### Opción 1: Desde el Panel de Supabase (Recomendado)
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a SQL Editor
3. Copia y pega el siguiente SQL:

```sql
-- Eliminar citas huérfanas (donde el professional_id no existe en professional_applications.user_id)
DELETE FROM public.appointments
WHERE professional_id NOT IN (
  SELECT user_id FROM public.professional_applications
);
```

4. Ejecuta la consulta
5. Verifica el resultado (debería eliminar 8 filas)

#### Opción 2: Desde la Terminal con Supabase CLI
```bash
cd database/migrations
supabase db push
```

### Verificación Después de la Limpieza

Después de ejecutar la migración, verifica que:

1. **No hay citas huérfanas:**
```sql
SELECT COUNT(*) 
FROM appointments a
WHERE NOT EXISTS (
  SELECT 1 FROM professional_applications pa 
  WHERE pa.user_id = a.professional_id
);
```
Resultado esperado: `0`

2. **Las estadísticas funcionan correctamente:**
```sql
-- Contar pacientes únicos por profesional
SELECT 
  pa.first_name,
  pa.last_name,
  pa.email,
  COUNT(DISTINCT a.patient_id) as unique_patients
FROM professional_applications pa
LEFT JOIN appointments a ON a.professional_id = pa.user_id
WHERE pa.status = 'approved'
GROUP BY pa.id, pa.first_name, pa.last_name, pa.email
ORDER BY unique_patients DESC;
```

3. **Las citas por usuario funcionan correctamente:**
```sql
-- Contar citas totales por usuario (como paciente o profesional)
SELECT 
  u.id,
  u.email,
  (SELECT COUNT(*) FROM appointments WHERE patient_id = u.id) as citas_como_paciente,
  (SELECT COUNT(*) FROM appointments WHERE professional_id = u.id) as citas_como_profesional,
  (SELECT COUNT(*) FROM appointments WHERE patient_id = u.id) + 
  (SELECT COUNT(*) FROM appointments WHERE professional_id = u.id) as total_citas
FROM auth.users u
ORDER BY total_citas DESC
LIMIT 10;
```

### Impacto
- **Datos eliminados:** 8 citas sin profesional válido
- **Usuarios afectados:** Ninguno (las citas no estaban vinculadas a profesionales reales)
- **Funcionalidad mejorada:** Las estadísticas del panel de administración mostrarán datos correctos

### Prevención Futura
Para prevenir este problema en el futuro, considera:

1. **Agregar Foreign Key Constraint** (Recomendado):
```sql
-- Esto asegurará que solo se puedan crear citas con professional_id válidos
ALTER TABLE public.appointments
ADD CONSTRAINT fk_professional_user
FOREIGN KEY (professional_id) REFERENCES auth.users(id)
ON DELETE CASCADE;
```

2. **Validación en la aplicación:**
- Siempre verificar que el professional_id exista en `professional_applications.user_id` antes de crear una cita
- Usar transacciones al crear/actualizar citas

---

**Fecha de detección:** 22 de octubre de 2025  
**Estado:** Pendiente de aplicación manual  
**Prioridad:** Alta (afecta visualización de estadísticas)

