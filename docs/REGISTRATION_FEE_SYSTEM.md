# Sistema de Pago de Inscripción para Profesionales

## Descripción General

Este sistema implementa una cuota de inscripción de **$1,000 MXN** que los profesionales deben pagar para poder aparecer en la plataforma Holistia. El pago es obligatorio además de la aprobación por parte de los administradores.

## Flujo del Sistema

### 1. Registro del Profesional

Cuando un usuario se registra para convertirse en profesional:

1. Completa el formulario de solicitud (datos personales, profesionales, servicios, etc.)
2. Envía la solicitud con estado `pending`
3. La solicitud queda registrada en `professional_applications` con:
   - `status`: `"pending"`
   - `registration_fee_paid`: `false`
   - `registration_fee_amount`: `1000.00`
   - `registration_fee_currency`: `"mxn"`

### 2. Página de Estado de la Solicitud

Después de enviar la solicitud, el profesional puede ver:

- **Estado de la solicitud** (pending, under_review, approved, rejected)
- **Estado del pago de inscripción** con badge de "Pagado" o "Pendiente"
- **Botón para pagar** si aún no ha pagado
- **Advertencias** sobre la necesidad de pagar para aparecer en la plataforma

#### Flujo de Pago

1. El profesional hace clic en "Pagar Inscripción"
2. Se crea una sesión de Stripe Checkout
3. Se crea un registro en la tabla `payments` con:
   - `payment_type`: `"registration"`
   - `amount`: `100000` (1000 MXN en centavos)
   - `status`: `"pending"`
   - `professional_application_id`: ID de la aplicación
4. El usuario es redirigido a Stripe para completar el pago
5. Al completar el pago exitosamente:
   - Stripe envía un webhook
   - Se actualiza el pago a `status: "succeeded"`
   - Se actualiza la aplicación: `registration_fee_paid: true`
6. El usuario es redirigido de vuelta con `?payment=success`

### 3. Aprobación por Administradores

Los administradores pueden:

1. Ver el estado del pago en el panel de profesionales
2. Aprobar la solicitud independientemente del pago
3. Ver advertencias si un profesional aprobado no ha pagado

**Importante**: Aprobar la solicitud NO hace automáticamente visible al profesional. Solo la combinación de:
- `status = "approved"` 
- `is_active = true`
- `registration_fee_paid = true`

...permite que el profesional aparezca en la plataforma.

### 4. Visibilidad en la Plataforma

Los profesionales solo aparecen en las páginas públicas si cumplen **TODAS** estas condiciones:

- ✅ `status = "approved"` (aprobado por administrador)
- ✅ `is_active = true` (activo en el sistema)
- ✅ `registration_fee_paid = true` (pagó la inscripción)

#### Páginas que filtran por pago:

- `/patient/[id]/explore` - Listado principal de profesionales
- `/patient/[id]/explore/favorites` - Favoritos del usuario
- `/patient/[id]/explore/professional/[slug]` - Perfil individual del profesional

## Estructura de la Base de Datos

### Tabla: `professional_applications`

Nuevos campos agregados:

```sql
registration_fee_paid BOOLEAN DEFAULT FALSE
registration_fee_amount NUMERIC DEFAULT 1000.00
registration_fee_currency TEXT DEFAULT 'mxn'
registration_fee_payment_id UUID (FK -> payments.id)
registration_fee_paid_at TIMESTAMP WITH TIME ZONE
registration_fee_stripe_session_id TEXT
```

### Tabla: `payments`

Nuevos campos agregados:

```sql
professional_application_id UUID (FK -> professional_applications.id)
payment_type TEXT CHECK (payment_type IN ('appointment', 'event', 'registration'))
```

## Endpoints de API

### POST `/api/stripe/registration-checkout`

Crea una sesión de Stripe Checkout para el pago de inscripción.

**Request Body:**
```json
{
  "professional_application_id": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Validaciones:**
- Usuario autenticado
- La aplicación existe y pertenece al usuario
- La aplicación no ha sido pagada previamente

### POST `/api/stripe/webhook`

Webhook de Stripe que maneja eventos de pago.

**Eventos manejados:**
- `checkout.session.completed`: Marca el pago como exitoso y actualiza la aplicación

## Migraciones

### Migración 50: Campos de pago en `professional_applications`

```sql
database/migrations/50_add_registration_fee_to_professional_applications.sql
```

Agrega los campos necesarios para rastrear el pago de inscripción.

### Migración 51: Campo `professional_application_id` en `payments`

```sql
database/migrations/51_add_professional_application_id_to_payments.sql
```

Relaciona los pagos con las aplicaciones profesionales y actualiza el constraint de `payment_type`.

## Tipos de TypeScript

### Payment Type

```typescript
export type PaymentType = 'appointment' | 'event' | 'registration';

export interface CreateRegistrationPaymentData {
  professional_application_id: string;
  user_id: string;
  amount?: number; // Default 1000 MXN
  description?: string;
}
```

### Professional Type

```typescript
export interface Professional {
  // ... otros campos
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_payment_id?: string;
  registration_fee_paid_at?: string;
  registration_fee_stripe_session_id?: string;
}
```

## Experiencia de Usuario

### Para Profesionales

1. **Durante el registro**: 
   - No se requiere el pago inmediatamente
   - Pueden enviar la solicitud y pagar después

2. **Después de enviar la solicitud**:
   - Ven claramente el estado del pago
   - Pueden pagar en cualquier momento
   - Reciben advertencias si no han pagado

3. **Después de ser aprobados**:
   - Si no han pagado: ven mensaje de que deben pagar para acceder al dashboard
   - Si ya pagaron: pueden acceder inmediatamente al dashboard profesional

### Para Administradores

1. **En el panel de profesionales**:
   - Ven el estado del pago de cada profesional
   - Pueden aprobar independientemente del pago
   - Ven advertencias para profesionales aprobados sin pago

2. **Al ver el perfil de un profesional**:
   - Sección dedicada mostrando el estado de pago
   - Fecha de pago si está disponible
   - Advertencia si está aprobado pero no ha pagado

### Para Pacientes

- Solo ven profesionales que cumplan todas las condiciones
- No ven ninguna referencia al pago de inscripción
- Experiencia transparente y sin fricciones

## Consideraciones de Seguridad

1. **Validación del usuario**: Solo el propietario de la aplicación puede iniciar el pago
2. **Prevención de pagos duplicados**: Se verifica que no haya pagado antes
3. **Webhook seguro**: Se verifica la firma de Stripe en los webhooks
4. **RLS (Row Level Security)**: Las políticas de Supabase protegen los datos sensibles

## Monitoreo y Mantenimiento

### Métricas importantes:

- Tasa de conversión: Aplicaciones enviadas vs. pagos completados
- Tiempo promedio entre aprobación y pago
- Profesionales aprobados pero sin pago

### Consultas útiles:

```sql
-- Profesionales aprobados sin pago
SELECT * FROM professional_applications 
WHERE status = 'approved' 
  AND registration_fee_paid = FALSE;

-- Pagos de inscripción del último mes
SELECT * FROM payments 
WHERE payment_type = 'registration' 
  AND created_at >= NOW() - INTERVAL '30 days';
```

## Próximos Pasos Potenciales

- [ ] Email de recordatorio para completar el pago
- [ ] Descuentos o promociones para early adopters
- [ ] Panel de analíticas para pagos de inscripción
- [ ] Opción de pago a plazos
- [ ] Renovaciones anuales de la inscripción

