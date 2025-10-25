# 🚀 Guía Rápida de Emails - Holistia

## ✅ Configuración en 5 Minutos

### 1. Obtener API Key de Resend

1. Ve a https://resend.com/signup
2. Crea una cuenta (gratis)
3. Ve a "API Keys"
4. Crea una nueva API Key
5. Copia la key (empieza con `re_`)

---

### 2. Configurar en Local

```bash
# En .env.local (este archivo NO se sube a git)
echo "RESEND_API_KEY=re_tu_key_aqui" >> .env.local

# Reiniciar servidor
npm run dev
```

---

### 3. Configurar en Producción (Vercel)

1. Ve a https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Agregar nueva variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_tu_key_aqui`
   - **Environments:** Production, Preview, Development
4. Redeploy el proyecto

---

### 4. Probar que Funciona

```bash
# Instalar ts-node globalmente
npm install -g ts-node

# Ejecutar test (reemplaza con tu email real)
npx ts-node scripts/test-emails.ts all tu-email@gmail.com
```

**Resultado esperado:**
```
✅ Successful: 3/3
🎉 All emails sent successfully!
```

**Verifica tu inbox:**
- Deberías recibir 3 emails de prueba
- Todos con el branding de Holistia
- Si no llegan, revisa spam

---

### 5. Verificar en Dashboard

1. Ve a https://resend.com/emails
2. Deberías ver los 3 emails enviados
3. Estado: "Delivered" ✅

---

## 📧 Tipos de Emails que se Envían

### 1. **Confirmación de Pago de Cita** 🎟️

**Cuándo:** Cuando un paciente paga una cita  
**A quién:** Paciente  
**Trigger:** Automático (Stripe webhook)  
**Template:** `appointment-payment-confirmation.html`

---

### 2. **Notificación a Profesional** 📬

**Cuándo:** Cuando alguien agenda una cita  
**A quién:** Profesional  
**Trigger:** Automático (Stripe webhook)  
**Template:** `appointment-notification-to-professional.html`

---

### 3. **Confirmación de Evento** 🎫

**Cuándo:** Cuando alguien se inscribe a un evento  
**A quién:** Usuario inscrito  
**Trigger:** Automático (Stripe webhook)  
**Template:** `event-payment-confirmation.html`

---

### 4. **Confirmación de Inscripción Anual** 🎉

**Cuándo:** Cuando un profesional paga su inscripción  
**A quién:** Profesional  
**Trigger:** Automático (Stripe webhook)  
**Template:** `registration-payment-confirmation.html`

---

## 🔧 Troubleshooting Rápido

### Problema: "Email no se envía"

```bash
# 1. Verificar que RESEND_API_KEY esté configurado
echo $RESEND_API_KEY
# Debe mostrar: re_xxxxxxxxxx

# 2. Si está vacío
echo "RESEND_API_KEY=re_tu_key" >> .env.local

# 3. Reiniciar servidor
npm run dev
```

---

### Problema: "Email se envía pero no llega"

1. **Revisa spam** - Los emails de prueba a veces van ahí
2. **Verifica en Resend Dashboard:**
   - https://resend.com/emails
   - Busca el email
   - Status debe ser "Delivered"
3. **Si status es "Bounced":**
   - Verifica que el email sea correcto
   - Intenta con otro email

---

### Problema: "Template not found"

```bash
# Verificar que los templates existan
ls database/email-templates/

# Deben existir:
# - appointment-payment-confirmation.html
# - appointment-notification-to-professional.html
# - event-payment-confirmation.html
# - registration-payment-confirmation.html
```

---

## 📊 Monitoreo

### Dashboard de Resend

**URL:** https://resend.com/emails

**Qué revisar:**
- ✅ Emails enviados hoy
- ✅ Tasa de entrega (>95%)
- ❌ Bounces (<5%)
- ❌ Complaints (<1%)

---

### Stripe Webhooks

**URL:** https://dashboard.stripe.com/webhooks

**Qué revisar:**
- ✅ Webhooks exitosos (200)
- ❌ Webhooks fallidos

---

### Logs de Vercel

**URL:** https://vercel.com/logs

**Buscar:**
- "Email sent successfully" ✅
- "Error sending email" ❌

---

## 🎯 Checklist Final

Antes de considerar emails como "funcionando":

- [ ] RESEND_API_KEY configurado en local
- [ ] RESEND_API_KEY configurado en Vercel
- [ ] Test de emails ejecutado (3/3 exitosos)
- [ ] Email de prueba recibido en inbox
- [ ] Dashboard de Resend muestra "Delivered"
- [ ] Webhooks de Stripe configurados
- [ ] Probado flujo completo end-to-end

---

## 📖 Documentación Completa

- **Sistema Completo:** `docs/EMAIL_SYSTEM.md`
- **Checklist Detallado:** `docs/EMAIL_VERIFICATION_CHECKLIST.md`
- **Script de Testing:** `scripts/test-emails.ts`

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa esta guía de nuevo
2. Ejecuta el test: `npx ts-node scripts/test-emails.ts all tu-email@test.com`
3. Revisa logs de Resend
4. Revisa logs de Vercel
5. Verifica variables de entorno

---

## ✨ ¡Listo!

Si el test pasó (3/3 emails), **¡los emails están funcionando correctamente!**

Cada vez que alguien haga una compra en la plataforma, recibirá automáticamente su ticket por email. 🎉

