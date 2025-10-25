# ✅ Checklist de Verificación de Emails

## Guía Rápida para Asegurar que los Emails Funcionen

---

## 🚀 Verificación Rápida (5 minutos)

### Paso 1: Verificar Variables de Entorno

```bash
# ¿Está configurado RESEND_API_KEY?
echo $RESEND_API_KEY
# Debe mostrar: re_xxxxxxxxxx

# Si está vacío, agrégalo a .env.local:
# RESEND_API_KEY=re_tu_clave_aqui
```

**En Producción (Vercel):**
1. Ve a Vercel Dashboard
2. Tu proyecto → Settings → Environment Variables
3. Verifica que `RESEND_API_KEY` exista

---

### Paso 2: Probar Envío de Emails

```bash
# Instalar ts-node si no lo tienes
npm install -g ts-node

# Probar email de appointment
npx ts-node scripts/test-emails.ts appointment tu-email@gmail.com

# Probar todos los emails
npx ts-node scripts/test-emails.ts all tu-email@gmail.com
```

**Resultado Esperado:**
```
✅ Successful: 3/3
🎉 All emails sent successfully!
```

---

### Paso 3: Verificar en Resend Dashboard

1. Ve a https://resend.com/emails
2. Busca los emails de prueba
3. Verifica estado: "Delivered" ✅

---

## 📋 Checklist Completo

### 1. Configuración ✅

- [ ] `RESEND_API_KEY` configurado en .env.local
- [ ] `RESEND_API_KEY` configurado en Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` configurado
- [ ] `STRIPE_WEBHOOK_SECRET` configurado
- [ ] Dominio verificado en Resend (opcional)

**Verificar:**
```bash
cd /Users/brangarciaramos/Proyectos/holistia
grep "RESEND_API_KEY" .env.local
```

---

### 2. Templates de Email ✅

Verificar que existan todos los templates:

- [ ] `appointment-payment-confirmation.html`
- [ ] `appointment-notification-to-professional.html`
- [ ] `event-payment-confirmation.html`
- [ ] `registration-payment-confirmation.html`

**Verificar:**
```bash
ls database/email-templates/
```

---

### 3. Funciones de Envío ✅

Verificar que las funciones usen Resend:

- [x] `sendAppointmentPaymentConfirmation` → Resend ✅
- [x] `sendEventConfirmationEmailSimple` → Resend ✅
- [x] `sendRegistrationPaymentConfirmation` → Resend ✅
- [ ] `sendAppointmentNotificationToProfessional` → ⚠️ Migrar
- [ ] `sendAppointmentConfirmationToPatient` → ⚠️ Migrar

**Archivo:** `src/lib/email-sender.ts`

---

### 4. Webhooks de Stripe ✅

Verificar que los webhooks disparen los emails:

- [x] `checkout.session.completed` → Appointment
- [x] `checkout.session.completed` → Event
- [x] `checkout.session.completed` → Registration

**Archivo:** `src/app/api/stripe/webhook/route.ts`

**Verificar en Stripe:**
1. Dashboard → Developers → Webhooks
2. Endpoint: `https://holistia.io/api/stripe/webhook`
3. Eventos seleccionados: `checkout.session.completed`

---

### 5. Testing Individual ✅

#### A. Email de Cita (Appointment)

```bash
npx ts-node scripts/test-emails.ts appointment tu-email@test.com
```

**Verificar:**
- [ ] Email llegó a inbox
- [ ] Título: "Tu Ticket de Cita con..."
- [ ] Template correcto
- [ ] Datos correctos

---

#### B. Email de Evento

```bash
npx ts-node scripts/test-emails.ts event tu-email@test.com
```

**Verificar:**
- [ ] Email llegó a inbox
- [ ] Título: "Tu Ticket para..."
- [ ] Código de confirmación visible
- [ ] Link al evento funciona

---

#### C. Email de Inscripción

```bash
npx ts-node scripts/test-emails.ts registration tu-email@test.com
```

**Verificar:**
- [ ] Email llegó a inbox
- [ ] Título: "Inscripción Confirmada..."
- [ ] Fecha de expiración correcta
- [ ] Link al dashboard funciona

---

### 6. Testing End-to-End 🔄

#### A. Probar con Stripe CLI

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/api/stripe/webhook

# En otra terminal, trigger evento
stripe trigger checkout.session.completed
```

**Verificar:**
- [ ] Webhook recibido
- [ ] Email enviado
- [ ] Logs sin errores

---

#### B. Probar Flujo Completo (Sandbox)

1. **Hacer una compra de prueba:**
   - Usar tarjeta de prueba: `4242 4242 4242 4242`
   - Cualquier fecha futura y CVC

2. **Verificar:**
   - [ ] Pago procesado en Stripe
   - [ ] Webhook recibido
   - [ ] Email enviado
   - [ ] Email llegó al destinatario

---

### 7. Monitoreo 📊

#### Resend Dashboard

- [ ] Ver emails enviados hoy
- [ ] Verificar tasa de entrega >95%
- [ ] Verificar no hay bounces
- [ ] Verificar no hay quejas de spam

**Link:** https://resend.com/emails

---

#### Stripe Dashboard

- [ ] Ver webhooks del día
- [ ] Verificar todos con status 200
- [ ] Verificar no hay errores

**Link:** https://dashboard.stripe.com/webhooks

---

#### Vercel Logs

- [ ] Verificar logs del día
- [ ] Buscar "Email sent successfully"
- [ ] Verificar no hay errores de email

**Link:** https://vercel.com/logs

---

## 🐛 Troubleshooting

### Problema: "RESEND_API_KEY is not defined"

**Solución:**
```bash
# Agregar a .env.local
echo "RESEND_API_KEY=re_tu_clave_aqui" >> .env.local

# Reiniciar servidor
npm run dev
```

---

### Problema: "Email not sent - Template not found"

**Solución:**
```bash
# Verificar que el template existe
ls database/email-templates/appointment-payment-confirmation.html

# Verificar path en función
grep "email-templates" src/lib/email-sender.ts
```

---

### Problema: "Email sent pero no llega"

**Solución:**
1. Revisar carpeta de spam
2. Verificar en Resend dashboard:
   - Status debe ser "Delivered"
   - Si es "Bounced", verificar email
   - Si es "Complained", está en spam
3. Verificar dominio verificado en Resend

---

### Problema: "Webhook no se dispara"

**Solución:**
1. Verificar URL en Stripe:
   - Debe ser: `https://holistia.io/api/stripe/webhook`
2. Verificar eventos seleccionados:
   - `checkout.session.completed`
3. Verificar signature:
   - `STRIPE_WEBHOOK_SECRET` correctamente configurado

**Testing local:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 📊 Métricas Objetivo

| Métrica | Target | Actual |
|---------|--------|--------|
| Tasa de Envío | >99% | ___ |
| Tasa de Entrega | >95% | ___ |
| Tasa de Bounce | <5% | ___ |
| Tasa de Spam | <1% | ___ |

**Revisar en:** https://resend.com/analytics

---

## ✅ Checklist Final

### Antes de Producción

- [ ] Todas las variables de entorno configuradas
- [ ] Todos los templates existen
- [ ] Testing individual pasado (3/3)
- [ ] Testing con Stripe CLI pasado
- [ ] Webhooks configurados en Stripe
- [ ] Dominio verificado en Resend (recomendado)
- [ ] Monitoreo configurado

### En Producción

- [ ] Primer email real enviado y verificado
- [ ] Métricas de Resend monitoreadas
- [ ] Logs de Vercel sin errores
- [ ] Webhooks de Stripe funcionando

---

## 🎯 Siguiente Paso

**Ejecuta el test completo ahora:**

```bash
npx ts-node scripts/test-emails.ts all tu-email@gmail.com
```

**Resultado esperado:**
- ✅ 3 emails enviados
- ✅ 3 emails recibidos
- ✅ Todos los templates correctos

---

## 📞 Soporte

**Si algo no funciona:**
1. Revisa esta checklist
2. Revisa `docs/EMAIL_SYSTEM.md`
3. Verifica logs en Resend
4. Verifica logs en Vercel

**Última verificación:** [Ejecutar checklist cada semana]

