# Instrucciones para marcar como pagadas las inscripciones de Armida y Mark

## Profesionales a actualizar

1. **Armida De la Garza**
   - Email: armidadelagarza@gmail.com
   - Profesión: Psicóloga
   - Ubicación: Guadalajara, Jalisco
   - Estado actual: ❌ Sin pagar (pero ya pagó externamente)

2. **Mark Aguayo**
   - Email: mark.arechiga@gmail.com
   - Profesión: Entrenador Personal
   - Ubicación: Zapopan, Jalisco
   - Estado actual: ❌ Sin pagar (pero ya pagó externamente)

## Problema

Ambos profesionales pagaron su inscripción anual externamente (fuera de la plataforma Stripe), pero el sistema aún los muestra como "Sin pagar" tanto en:
- Panel de administración
- Dashboard del profesional

## Solución

### Opción 1: Ejecutar script SQL manualmente (Recomendado)

1. Abrir Supabase SQL Editor
2. Ejecutar el script: `database/scripts/marcar_pago_externo_armida_mark.sql`
3. Ejecutar las consultas UNA POR UNA en este orden:
   - Primero: Verificación inicial
   - Segundo: UPDATE para Armida
   - Tercero: Verificación de Armida
   - Cuarto: UPDATE para Mark
   - Quinto: Verificación de Mark
   - Sexto: Verificación final
   - Séptimo: (Opcional) Crear registros de pago en la tabla payments

### Opción 2: Usar el API endpoint de sincronización

```bash
# Llamar al endpoint de sincronización de pagos de registro
curl -X POST https://holistia.io/api/admin/sync-registration-payments \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Nota**: Este endpoint sincroniza automáticamente los pagos de Stripe con la base de datos, pero NO funciona para pagos externos.

## Cambios que hace el script

Para cada profesional:

1. **Actualiza `professional_applications`**:
   ```sql
   registration_fee_paid = true
   registration_fee_amount = 299.00
   registration_fee_currency = 'mxn'
   registration_fee_paid_at = NOW()
   registration_fee_expires_at = NOW() + INTERVAL '1 year'
   ```

2. **Crea registro en `payments` (opcional pero recomendado)**:
   - Tipo: 'registration'
   - Estado: 'succeeded'
   - Monto: 299.00 MXN
   - Descripción: "Pago de inscripción anual (registrado manualmente - pago externo)"

## Verificación post-ejecución

Después de ejecutar el script:

1. **En el panel de administración** (`/admin/{id}/professionals`):
   - Ambos profesionales deberían aparecer con: ✅ Pagado
   - Estado: Activo (si tienen Stripe conectado)

2. **En el dashboard del profesional**:
   - No debe aparecer el mensaje de "Pago de Inscripción Pendiente"
   - Si aparece mensaje de inscripción activa: ✅ Inscripción Activa

3. **Ejecutar query de verificación**:
   ```sql
   SELECT
       first_name,
       last_name,
       email,
       registration_fee_paid,
       registration_fee_paid_at,
       registration_fee_expires_at,
       CASE
           WHEN registration_fee_expires_at > NOW() THEN 'Vigente'
           ELSE 'Expirado'
       END as estado_inscripcion
   FROM professional_applications
   WHERE email IN ('armidadelagarza@gmail.com', 'mark.arechiga@gmail.com');
   ```

## Notas importantes

- ✅ Los pagos externos son válidos y comunes
- ✅ El script es idempotente (se puede ejecutar múltiples veces sin duplicar)
- ✅ La fecha de expiración se establece automáticamente a 1 año desde ahora
- ⚠️ Si ya tienen un pago de registro en la tabla `payments`, la parte opcional no creará un duplicado
- 📅 La inscripción expirará exactamente 1 año después de ejecutar este script

## Fecha de ejecución

Script creado: 2025-12-29

## Responsable

Ejecutar con usuario administrador de Supabase
