# Instrucciones: Perdonar Primer Año de Inscripción

## Contexto
Los profesionales que ya están registrados en Holistia antes de implementar el sistema de cuota anual de $1,000 MXN recibirán su primer año **gratis** como cortesía. A partir del próximo año, deberán pagar para renovar su suscripción.

## ¿Qué Hace Esta Actualización?

Para cada profesional aprobado que aún no ha pagado:
- ✅ Marca `registration_fee_paid = TRUE`
- ✅ Establece `registration_fee_paid_at = AHORA`
- ✅ Establece `registration_fee_expires_at = AHORA + 1 año`
- ✅ Establece el monto en $1,000 MXN

Esto significa que:
1. Los profesionales aparecerán inmediatamente en la plataforma
2. En 1 año, el sistema les recordará que deben renovar
3. Si no renuevan, dejarán de aparecer en la plataforma

## Instrucciones para Aplicar

### Opción 1: Desde el Panel de Supabase (Recomendado)

1. **Ve a tu proyecto en Supabase**: https://supabase.com/dashboard
2. **Navega a SQL Editor**
3. **Copia y pega el siguiente SQL:**

```sql
-- Actualizar todos los profesionales aprobados existentes
-- para que tengan el primer año de inscripción pagado (gratis)
UPDATE public.professional_applications
SET 
  registration_fee_paid = TRUE,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn'
WHERE 
  status = 'approved'
  AND registration_fee_paid IS NOT TRUE;
```

4. **Ejecuta la consulta**
5. Verás cuántos profesionales fueron actualizados

### Opción 2: Usando Supabase CLI

```bash
cd database/migrations
supabase db push
```

## Verificación Después de la Actualización

### 1. Verificar que todos los profesionales aprobados tienen el año pagado:

```sql
SELECT 
  id,
  first_name,
  last_name,
  email,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) as dias_hasta_expiracion
FROM public.professional_applications
WHERE status = 'approved'
ORDER BY registration_fee_expires_at ASC;
```

### 2. Verificar profesionales que aparecerán en la plataforma:

```sql
SELECT 
  COUNT(*) as total_visibles,
  COUNT(CASE WHEN registration_fee_expires_at < NOW() + INTERVAL '30 days' THEN 1 END) as expiran_pronto
FROM public.professional_applications
WHERE 
  status = 'approved'
  AND is_active = TRUE
  AND registration_fee_paid = TRUE
  AND registration_fee_expires_at > NOW();
```

### 3. Ver próximas expiraciones (para planear recordatorios):

```sql
SELECT 
  first_name,
  last_name,
  email,
  registration_fee_expires_at,
  EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) as dias_restantes
FROM public.professional_applications
WHERE 
  status = 'approved'
  AND registration_fee_paid = TRUE
  AND registration_fee_expires_at > NOW()
ORDER BY registration_fee_expires_at ASC
LIMIT 20;
```

## Resultados Esperados

Después de ejecutar esta actualización:

✅ **Todos los profesionales aprobados aparecerán en la plataforma inmediatamente**
- En la página de explorar: `/patient/[id]/explore`
- En perfiles individuales: `/patient/[id]/explore/professional/[slug]`
- En favoritos: `/patient/[id]/explore/favorites`

✅ **En el panel de administración** (`/admin/[id]/professionals`):
- Verás el estado "Vigente" con badge verde
- Verás la fecha de expiración (dentro de 1 año)
- Podrás monitorear cuándo necesitan renovar

✅ **En la página de solicitud profesional** (`/patient/[id]/explore/become-professional`):
- Los profesionales existentes verán que su pago está "Vigente"
- Verán la fecha de expiración
- Cuando falten 30 días, verán una advertencia para renovar

## Recordatorios Futuros

Para implementar un sistema de recordatorios automáticos (recomendado):

### A 30 días de expiración:
```sql
-- Profesionales que necesitan renovar pronto
SELECT email, first_name, last_name, registration_fee_expires_at
FROM professional_applications
WHERE status = 'approved'
  AND registration_fee_paid = TRUE
  AND registration_fee_expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';
```

### Ya expirados:
```sql
-- Profesionales cuya inscripción ya expiró
SELECT email, first_name, last_name, registration_fee_expires_at
FROM professional_applications
WHERE status = 'approved'
  AND registration_fee_paid = TRUE
  AND registration_fee_expires_at < NOW();
```

## Consideraciones

1. **No afecta a nuevos profesionales**: Los que se registren después de esta actualización deberán pagar su inscripción inicial

2. **No crea registros de pago**: Esta actualización NO crea registros en la tabla `payments` porque es una cortesía. Solo los pagos reales (renovaciones futuras) crearán registros de pago.

3. **Es segura de ejecutar múltiples veces**: La condición `AND registration_fee_paid IS NOT TRUE` asegura que solo afecte a profesionales que aún no tienen el pago marcado.

---

**Fecha de creación:** 22 de octubre de 2025  
**Propósito:** Migración de profesionales existentes al nuevo sistema de cuota anual  
**Beneficio:** Primer año gratis para profesionales establecidos

