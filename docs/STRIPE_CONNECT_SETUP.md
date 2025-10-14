# Stripe Connect - Sistema de Comisiones

## Descripción General

Holistia utiliza Stripe Connect para procesar pagos y cobrar comisiones automáticamente. Los profesionales y organizadores de eventos reciben pagos directamente en sus cuentas de Stripe, mientras que la plataforma retiene una comisión por cada transacción.

## Comisiones de la Plataforma

- **Citas con Profesionales**: 15%
- **Eventos y Talleres**: 20%

## Arquitectura

### Flujo de Pagos

1. **Cliente realiza pago** → Stripe cobra el monto completo
2. **Stripe retiene comisión** → Automáticamente separa el fee de la plataforma
3. **Transferencia automática** → El resto va directamente a la cuenta del profesional/organizador

### Componentes Implementados

#### 1. Base de Datos (`database/migrations/40_add_stripe_connect_accounts.sql`)

**Tablas actualizadas:**
- `professional_applications`: Campos de Stripe Connect agregados
  - `stripe_account_id`: ID de cuenta conectada
  - `stripe_account_status`: Estado de conexión
  - `stripe_onboarding_completed`: Si completó onboarding
  - `stripe_charges_enabled`: Si puede recibir pagos
  - `stripe_payouts_enabled`: Si puede recibir transferencias
  - `stripe_connected_at`: Fecha de conexión

- `events_workshops`: Mismos campos que professional_applications

- `payments`: Campos de seguimiento de transferencias
  - `stripe_transfer_id`: ID de transferencia
  - `transfer_amount`: Monto transferido
  - `platform_fee`: Comisión de plataforma
  - `transfer_status`: Estado de transferencia

#### 2. Funciones de Stripe (`src/lib/stripe.ts`)

**Funciones principales:**
- `calculateCommission()`: Calcula comisión de la plataforma
- `calculateTransferAmount()`: Calcula monto para profesional
- `createConnectAccount()`: Crea cuenta Express de Stripe Connect
- `createAccountLink()`: Genera URL de onboarding
- `getAccountStatus()`: Obtiene estado de cuenta conectada
- `createLoginLink()`: Genera acceso al dashboard de Stripe

#### 3. Endpoints API

**`/api/stripe/connect/create-account`**
- POST: Crea cuenta de Stripe Connect y retorna URL de onboarding
- Body: `{ professional_id, entity_type: 'professional' }`

**`/api/stripe/connect/account-status`**
- POST: Verifica y actualiza estado de cuenta conectada
- Body: `{ professional_id }`

**`/api/stripe/connect/dashboard-link`**
- POST: Genera link de acceso al dashboard de Stripe
- Body: `{ professional_id }`

#### 4. Checkout Actualizado

**Citas Profesionales** (`/api/stripe/checkout`)
```typescript
payment_intent_data: {
  application_fee_amount: formatAmountForStripe(platformFee), // 15%
  transfer_data: {
    destination: professional.stripe_account_id
  }
}
```

**Eventos** (`/api/stripe/event-checkout`)
```typescript
payment_intent_data: {
  application_fee_amount: formatAmountForStripe(platformFee), // 20%
  transfer_data: {
    destination: organizer.stripe_account_id
  }
}
```

#### 5. Webhooks (`/api/stripe/webhook`)

**Eventos manejados:**
- `checkout.session.completed`: Actualiza estado de pago y transferencia
- `payment_intent.succeeded`: Confirma pago exitoso
- `payment_intent.payment_failed`: Marca pago como fallido
- `charge.refunded`: Maneja reembolsos

#### 6. Componente UI (`src/components/ui/stripe-connect-button.tsx`)

**Características:**
- Muestra estado de conexión con badge visual
- Botón para conectar/completar configuración
- Acceso directo al dashboard de Stripe
- Botón de refrescar estado
- Información de comisiones

## Configuración Inicial

### 1. Aplicar Migración de Base de Datos

```sql
-- Ejecutar en Supabase SQL Editor
-- Ver: database/migrations/40_add_stripe_connect_accounts.sql
```

### 2. Configurar Stripe Dashboard

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com)
2. Navegar a **Connect** > **Settings**
3. Configurar:
   - Nombre de la plataforma: "Holistia"
   - Icono/Logo
   - URLs de redirect:
     - Success: `https://tudominio.com/professional/[id]/dashboard?stripe_onboarding=success`
     - Refresh: `https://tudominio.com/professional/[id]/dashboard?stripe_onboarding=refresh`

### 3. Variables de Entorno

Las siguientes variables ya deben estar configuradas:
```env
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Configurar Webhooks

En Stripe Dashboard > Developers > Webhooks:
1. Agregar endpoint: `https://tudominio.com/api/stripe/webhook`
2. Seleccionar eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

## Flujo de Usuario

### Para Profesionales

1. **Iniciar Sesión** → Dashboard profesional
2. **Ver sección "Configuración de Pagos"**
3. **Click en "Conectar con Stripe"**
4. **Completar onboarding de Stripe**:
   - Información personal
   - Datos bancarios
   - Verificación de identidad
5. **Estado cambia a "Conectado"**
6. **Ya puede recibir pagos**

### Para Pacientes

1. **Reservar cita o evento**
2. **Checkout de Stripe** (monto completo)
3. **Pago confirmado**
4. **Transferencia automática**:
   - 15% o 20% → Holistia
   - 85% o 80% → Profesional/Organizador

## Monitoreo y Administración

### Dashboard de Profesional

Los profesionales pueden:
- Ver estado de conexión
- Acceder a dashboard de Stripe
- Ver historial de pagos
- Gestionar cuenta bancaria
- Ver balance disponible

### Dashboard de Stripe (Plataforma)

Desde el dashboard de Stripe, puedes:
- Ver todas las transacciones
- Monitorear comisiones ganadas
- Gestionar cuentas conectadas
- Manejar disputas y reembolsos
- Ver reportes financieros

### Supabase Database

Consultas útiles:

```sql
-- Profesionales con Stripe conectado
SELECT 
  first_name, 
  last_name, 
  stripe_account_status,
  stripe_charges_enabled,
  stripe_connected_at
FROM professional_applications
WHERE stripe_account_id IS NOT NULL;

-- Pagos y comisiones
SELECT 
  p.id,
  p.service_amount,
  p.platform_fee,
  p.transfer_amount,
  p.commission_percentage,
  p.status,
  p.paid_at
FROM payments p
WHERE p.status = 'succeeded'
ORDER BY p.paid_at DESC;

-- Total de comisiones por mes
SELECT 
  DATE_TRUNC('month', paid_at) as month,
  COUNT(*) as transactions,
  SUM(service_amount) as total_revenue,
  SUM(platform_fee) as total_commission
FROM payments
WHERE status = 'succeeded'
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC;
```

## Validaciones de Seguridad

### Antes de Checkout

1. ✅ Verifica que profesional/organizador tenga `stripe_account_id`
2. ✅ Verifica que `stripe_charges_enabled = true`
3. ✅ Verifica que `stripe_payouts_enabled = true`
4. ❌ Si no cumple → Error: "Cuenta de pagos no configurada"

### Durante Pago

1. ✅ Cliente autenticado (user_id verificado)
2. ✅ Monto válido (> 0)
3. ✅ Registro en BD antes de checkout
4. ✅ Metadata completa en sesión de Stripe

### Post-Pago

1. ✅ Webhook verifica firma de Stripe
2. ✅ Actualiza estado en BD
3. ✅ Marca transferencia como completada
4. ✅ Confirma cita/evento

## Troubleshooting

### "El profesional aún no ha configurado su cuenta de pagos"

**Causa**: Profesional no ha conectado Stripe o no completó onboarding

**Solución**:
1. Profesional debe ir a Dashboard
2. Click en "Conectar con Stripe"
3. Completar formulario de Stripe
4. Verificar identidad y cuenta bancaria

### "La cuenta de pagos no está completamente configurada"

**Causa**: Onboarding incompleto o cuenta restringida

**Solución**:
1. Click en "Completar configuración"
2. Revisar requisitos pendientes en Stripe
3. Proporcionar documentación adicional si es necesario

### "Error al crear sesión de pago"

**Causa**: Problemas con API de Stripe

**Solución**:
1. Verificar variables de entorno
2. Revisar logs en Stripe Dashboard
3. Confirmar que cuenta no está restringida
4. Verificar límites de API

### Transferencias no aparecen

**Causa**: Transferencias automáticas pueden tardar 2-7 días

**Solución**:
1. Verificar en dashboard de Stripe del profesional
2. Confirmar cuenta bancaria verificada
3. Revisar balance de Stripe

## Testing

### Modo Test de Stripe

Usar tarjetas de prueba:
- **Exitosa**: `4242 4242 4242 4242`
- **Fallida**: `4000 0000 0000 0002`
- **Requiere autenticación**: `4000 0025 0000 3155`

CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura

### Verificar Comisiones

```javascript
// Cita de $1000 MXN
const serviceAmount = 1000;
const platformFee = calculateCommission(1000, 15); // 150
const transferAmount = calculateTransferAmount(1000, 15); // 850

// Evento de $500 MXN
const eventAmount = 500;
const eventFee = calculateCommission(500, 20); // 100
const eventTransfer = calculateTransferAmount(500, 20); // 400
```

## Mejoras Futuras

- [ ] Dashboard de analytics de ingresos
- [ ] Sistema de bonos/incentivos para profesionales
- [ ] Configuración de comisiones variables por categoría
- [ ] Soporte para pagos recurrentes (suscripciones)
- [ ] Integración con facturación automática
- [ ] Reportes de impuestos descargables

## Referencias

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Application Fees](https://stripe.com/docs/connect/direct-charges#collecting-fees)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Consultar Stripe Dashboard logs
3. Revisar logs de Supabase
4. Contactar a soporte de Stripe si es necesario

