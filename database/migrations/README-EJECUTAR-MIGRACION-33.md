# Migración 33: Fix Payments Registration Constraint

## Problema

Los profesionales no pueden pagar su inscripción porque la tabla `payments` tiene una restricción que solo permite pagos de tipo 'appointment' o 'event', pero no 'registration'.

**Error:**
```
Error al crear el registro de pago: new row for relation "payments" violates check constraint "payments_appointment_or_event_check"
```

## Solución

La migración `33_fix_payments_registration_constraint.sql` actualiza las restricciones de la tabla `payments` para permitir pagos de tipo 'registration'.

## Cómo Ejecutar

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Holistia**
3. En el menú lateral, ve a **SQL Editor**
4. Haz clic en **New Query**
5. Copia y pega el contenido completo de `33_fix_payments_registration_constraint.sql`
6. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`
7. Verifica que se ejecutó correctamente (debería mostrar "Success")

## Verificación

Después de ejecutar la migración:

1. Ve a https://www.holistia.io/patient/[tu-id]/explore/become-professional
2. Haz clic en el botón "Pagar Inscripción"
3. Deberías ser redirigido a Stripe Checkout sin errores

## Cambios Realizados

- ✅ Actualizado `payment_type` constraint para incluir 'registration'
- ✅ Actualizado `payments_appointment_or_event_check` para permitir pagos sin `appointment_id` ni `event_id` cuando el tipo es 'registration'
- ✅ Agregado índice para `professional_application_id` para mejorar rendimiento
- ✅ Agregado comentario descriptivo a la restricción

## Nota Importante

**Esta migración debe ejecutarse INMEDIATAMENTE** para que los profesionales puedan pagar su inscripción.
