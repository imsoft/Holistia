# 📧 Sistema de Emails - Holistia

## Resumen

Holistia envía emails automáticos en diferentes momentos del flujo de usuario. Este documento detalla todos los emails, cuándo se envían, y cómo verificar que funcionen.

---

## 🎯 Emails Configurados

### 1. **Confirmación de Pago de Cita** 🎟️
**Archivo:** `appointment-payment-confirmation.html`  
**Función:** `sendAppointmentPaymentConfirmation()`  
**Método:** Resend ✅

**Cuándo se envía:**
- Cuando un paciente paga una cita con Stripe
- Trigger: Webhook `checkout.session.completed` con `appointment_id`

**A quién:**
- Paciente que realizó el pago

**Contenido:**
- Ticket de confirmación
- Datos del profesional
- Fecha/hora de la cita
- Información de pago
- Número de ticket

**Estado:** ✅ FUNCIONANDO

---

### 2. **Notificación a Profesional (Nueva Cita)** 📬
**Archivo:** `appointment-notification-to-professional.html`  
**Función:** `sendAppointmentNotificationToProfessional()`  
**Método:** supabase.functions.invoke ⚠️

**Cuándo se envía:**
- Cuando un paciente paga una cita
- Trigger: Webhook `checkout.session.completed` con `appointment_id`

**A quién:**
- Profesional que recibirá la cita

**Contenido:**
- Nueva cita agendada
- Datos del paciente
- Fecha/hora de la cita
- Link a dashboard de citas

**Estado:** ⚠️ USAR RESEND (migrar)

---

### 3. **Confirmación de Pago de Evento** 🎫
**Archivo:** `event-payment-confirmation.html`  
**Función:** `sendEventConfirmationEmailSimple()`  
**Método:** Resend ✅

**Cuándo se envía:**
- Cuando un usuario paga inscripción a evento
- Trigger: Webhook `checkout.session.completed` con `event_registration_id`

**A quién:**
- Usuario que se inscribió al evento

**Contenido:**
- Ticket de confirmación
- Código de confirmación
- Datos del evento
- Información de pago

**Estado:** ✅ FUNCIONANDO

---

### 4. **Confirmación de Inscripción Anual** 🎉
**Archivo:** `registration-payment-confirmation.html`  
**Función:** `sendRegistrationPaymentConfirmation()`  
**Método:** Resend ✅

**Cuándo se envía:**
- Cuando un profesional paga su inscripción anual
- Trigger: Webhook `checkout.session.completed` con `payment_type = 'registration'`

**A quién:**
- Profesional que pagó

**Contenido:**
- Bienvenida a Holistia
- Recibo de pago
- Fecha de expiración
- Link al dashboard

**Estado:** ✅ FUNCIONANDO

---

### 5. **Confirmación de Cita al Paciente** ✅
**Archivo:** `appointment-confirmation-to-patient.html`  
**Función:** `sendAppointmentConfirmationToPatient()`  
**Método:** supabase.functions.invoke ⚠️

**Cuándo se envía:**
- Cuando el profesional confirma la cita
- Trigger: Manual desde dashboard del profesional

**A quién:**
- Paciente que agendó la cita

**Contenido:**
- Confirmación de cita
- Datos del profesional
- Fecha/hora confirmada

**Estado:** ⚠️ NO IMPLEMENTADO (migrar a Resend)

---

### 6. **Recordatorio de Renovación** 📅
**Archivo:** `registration-renewal-reminder.html`  
**Función:** TBD  
**Método:** Resend (cuando se implemente)

**Cuándo se envía:**
- 30 días antes de que expire la inscripción anual
- Trigger: Cron job

**A quién:**
- Profesionales con inscripción próxima a vencer

**Contenido:**
- Recordatorio de renovación
- Fecha de expiración
- Link para renovar

**Estado:** ⚠️ PENDIENTE IMPLEMENTAR

---

### 7. **Confirm Signup** (Supabase Auth) 📬
**Archivo:** `confirm-signup.html`  
**Método:** Supabase Auth  

**Cuándo se envía:**
- Cuando un usuario se registra
- Automático por Supabase

**Estado:** ✅ FUNCIONANDO (Supabase)

---

### 8. **Reset Password** (Supabase Auth) 🔑
**Archivo:** `reset-password.html`  
**Método:** Supabase Auth  

**Cuándo se envía:**
- Cuando un usuario solicita restablecer contraseña
- Automático por Supabase

**Estado:** ✅ FUNCIONANDO (Supabase)

---

## 🔧 Configuración Requerida

### Variables de Entorno

```bash
# Resend API Key (para emails transaccionales)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Site URL (para links en emails)
NEXT_PUBLIC_SITE_URL=https://holistia.io

# Stripe Webhook Secret (para verificar firma)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Verificar Configuración

```bash
# Verificar que RESEND_API_KEY esté configurado
echo $RESEND_API_KEY

# Verificar en Vercel Dashboard:
# Settings > Environment Variables
```

---

## 🧪 Testing de Emails

### 1. Testing Manual

```typescript
// test/email-test.ts
import { sendAppointmentPaymentConfirmation } from '@/lib/email-sender';

async function testAppointmentEmail() {
  const result = await sendAppointmentPaymentConfirmation({
    patient_name: "Test Patient",
    patient_email: "tu-email@test.com",
    professional_name: "Dr. Test",
    professional_title: "Psicólogo",
    appointment_date: "lunes, 1 de enero de 2025",
    appointment_time: "10:00",
    appointment_type: "Online",
    duration_minutes: 50,
    location: "Consulta en línea",
    payment_amount: 1000,
    payment_date: "1 de enero de 2025",
    payment_method: "Tarjeta",
    transaction_id: "test_12345",
    ticket_number: "TEST1234",
  });

  console.log('Result:', result);
}

testAppointmentEmail();
```

### 2. Testing con Stripe CLI

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test webhook
stripe trigger checkout.session.completed
```

### 3. Testing en Resend Dashboard

1. Ve a https://resend.com/dashboard
2. Logs → Ver emails enviados
3. Ver estado de entrega
4. Ver errores si los hay

---

## 🐛 Troubleshooting

### Email No se Envía

**1. Verificar que RESEND_API_KEY esté configurado:**
```bash
# En servidor/Vercel
echo $RESEND_API_KEY
```

**2. Verificar logs en Resend:**
- Dashboard de Resend → Logs
- Buscar por email del destinatario

**3. Verificar logs de Stripe:**
- Dashboard de Stripe → Developers → Webhooks
- Ver si el webhook se disparó
- Ver response del endpoint

**4. Verificar logs de aplicación:**
```bash
# En Vercel
vercel logs

# Local
npm run dev # Ver console logs
```

---

### Email Se Envía Pero No Llega

**1. Verificar spam:**
- Revisar carpeta de spam del destinatario

**2. Verificar dominio:**
- Resend debe tener el dominio verificado
- Si es `noreply@holistia.io`, el dominio debe estar configurado

**3. Ver estado en Resend:**
- Dashboard → Emails → Ver status
- "delivered", "bounced", "complained"

---

### Webhook No se Dispara

**1. Verificar signature:**
```typescript
// En webhook route
const signature = req.headers.get('stripe-signature');
// Debe estar presente
```

**2. Verificar endpoint en Stripe:**
- Dashboard → Developers → Webhooks
- URL debe ser correcta
- Eventos seleccionados correctamente

**3. Testing local:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 📊 Monitoreo

### Métricas a Revisar

1. **Tasa de Envío:**
   - % de emails enviados vs intentados
   - Target: >99%

2. **Tasa de Entrega:**
   - % de emails entregados vs enviados
   - Target: >95%

3. **Tasa de Bounce:**
   - % de emails que rebotan
   - Target: <5%

4. **Tasa de Spam:**
   - % de emails marcados como spam
   - Target: <1%

### Herramientas

- **Resend Dashboard:** https://resend.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Logs:** https://vercel.com

---

## ⚠️ Mejoras Pendientes

### Priority 1 (Alta)

- [x] ~~Migrar emails de pago a Resend~~
- [ ] Migrar notificación a profesional a Resend
- [ ] Migrar confirmación a paciente a Resend
- [ ] Implementar recordatorio de renovación

### Priority 2 (Media)

- [ ] Agregar tests automatizados de emails
- [ ] Configurar dominio personalizado en Resend
- [ ] Agregar retry logic para emails fallidos
- [ ] Implementar email de bienvenida personalizado

### Priority 3 (Baja)

- [ ] Analytics de apertura de emails
- [ ] A/B testing de subject lines
- [ ] Templates personalizables por profesional

---

## 📝 Checklist Pre-Producción

- [ ] RESEND_API_KEY configurado en Vercel
- [ ] STRIPE_WEBHOOK_SECRET configurado
- [ ] Dominio verificado en Resend (opcional pero recomendado)
- [ ] Testing de cada tipo de email
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

---

## 🔗 Links Útiles

- Resend Docs: https://resend.com/docs
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Templates: `/database/email-templates/`
- Email Sender: `/src/lib/email-sender.ts`
- Webhook Handler: `/src/app/api/stripe/webhook/route.ts`

---

## 📞 Soporte

**Problemas con emails:**
1. Revisar logs de Resend
2. Revisar logs de Stripe
3. Revisar logs de Vercel
4. Verificar variables de entorno

**Última actualización:** [Fecha actual]

