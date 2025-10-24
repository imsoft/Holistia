# Sistema de Emails con Tickets - Holistia

## 📧 Resumen

Holistia ahora envía automáticamente emails de confirmación con tickets para cada compra realizada en la plataforma:

- **Citas**: Ticket de pago para el paciente + notificación al profesional
- **Eventos**: Ticket con código de confirmación para el participante
- **Inscripciones**: Recibo de inscripción anual para el profesional

## 🎨 Diseño de los Emails

Todos los templates tienen el look and feel de Holistia:
- Colores corporativos (verde para citas, púrpura para eventos e inscripciones)
- Logo de Holistia
- Diseño responsive (se ve bien en móvil y desktop)
- Información completa de la transacción
- Instrucciones claras para el usuario

## 📝 Templates Creados

### 1. `appointment-payment-confirmation.html`
**Ticket de Cita para Pacientes**
- Número de ticket único
- Información del profesional
- Detalles de la cita (fecha, hora, ubicación, duración)
- Resumen completo del pago
- Instrucciones para el día de la cita

### 2. `event-payment-confirmation.html` (mejorado)
**Ticket de Evento para Participantes**
- Código de confirmación
- Información del evento completa
- Detalles del pago
- Instrucciones de llegada
- Link al evento

### 3. `registration-payment-confirmation.html`
**Recibo de Inscripción para Profesionales**
- Información profesional
- Detalles de la inscripción anual
- Fecha de expiración (1 año)
- Beneficios incluidos
- Próximos pasos
- Link al dashboard

## 🔧 Configuración de Resend

### Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita (incluye 3,000 emails/mes gratis)
3. Verifica tu email

### Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre descriptivo (ej: "Holistia Production")
4. Copia la API key (solo se muestra una vez)

### Paso 3: Configurar dominio (Recomendado para producción)

#### Opción A: Usar dominio personalizado (Recomendado)

1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio: `holistia.io`
4. Agrega los registros DNS que Resend te proporciona a tu proveedor de dominio:
   - **MX Record**
   - **TXT Record (SPF)**
   - **TXT Record (DKIM)**
   - **CNAME Record (DKIM)**
5. Espera la verificación (puede tardar hasta 72 horas, pero usualmente es en minutos)

#### Opción B: Usar dominio de Resend (Para testing)

Si solo quieres probar, puedes usar el dominio compartido de Resend temporalmente.

### Paso 4: Agregar la API Key a tu proyecto

Agrega la siguiente variable a tu archivo `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:** Nunca subas la API key a GitHub. El archivo `.env.local` ya está en `.gitignore`.

### Paso 5: Configurar el email "From"

Una vez que tu dominio esté verificado, actualiza el remitente en el código si es necesario:

En `src/lib/email-sender.ts`, el `from` está configurado como:
```typescript
from: 'Holistia <noreply@holistia.io>'
```

Si tu dominio verificado es diferente, cámbialo en:
- `sendEventConfirmationEmailSimple()`
- `sendAppointmentPaymentConfirmation()`
- `sendRegistrationPaymentConfirmation()`

## 📬 Flujo de Envío de Emails

### Cuando se completa un pago (Stripe Webhook)

1. **Pago de Cita:**
   - ✅ Actualiza el pago en la BD
   - ✅ Confirma la cita
   - 📧 Envía notificación al profesional
   - 🎟️ **Envía ticket al paciente** (NUEVO)

2. **Pago de Evento:**
   - ✅ Actualiza el pago en la BD
   - ✅ Confirma el registro
   - 🎟️ **Envía ticket al participante** (NUEVO)

3. **Pago de Inscripción:**
   - ✅ Actualiza el pago en la BD
   - ✅ Activa la cuenta profesional
   - ✅ Establece fecha de expiración (1 año)
   - 🎟️ **Envía recibo al profesional** (NUEVO)

## 🧪 Cómo Probar

### Testing en Local (sin enviar emails reales)

Si `RESEND_API_KEY` no está configurada, los logs aparecerán en la consola pero no se enviarán emails.

### Testing con Resend (envío real)

1. Configura tu `RESEND_API_KEY` en `.env.local`
2. Inicia tu servidor local: `pnpm dev`
3. Usa Stripe CLI para probar webhooks localmente:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Haz una compra de prueba en tu entorno local
5. Revisa tu email para ver el ticket

### Testing en Producción

1. Despliega tu código a Vercel
2. Configura la variable de entorno en Vercel:
   - Ve a **Settings** → **Environment Variables**
   - Agrega `RESEND_API_KEY` con tu API key
   - Guarda y redespliega
3. Configura el webhook de Stripe en producción:
   - En Stripe Dashboard, ve a **Developers** → **Webhooks**
   - Agrega endpoint: `https://holistia.io/api/stripe/webhook`
   - Selecciona eventos: `checkout.session.completed`
4. Haz una compra real de prueba

## 📊 Monitoreo

### En Resend

- Ve a **Logs** en tu dashboard de Resend
- Verás todos los emails enviados, entregados, abiertos y clicks
- Puedes ver el contenido HTML de cada email enviado

### En tu Aplicación

Los logs en el servidor mostrarán:
- ✅ Emails enviados exitosamente
- ❌ Errores al enviar emails
- 📧 IDs de los emails enviados por Resend

## 💰 Límites y Costos

### Plan Gratuito de Resend
- **3,000 emails/mes gratis**
- Perfecto para empezar y testing

### Plan Pro ($20/mes)
- **50,000 emails/mes**
- Custom domains ilimitados
- Soporte prioritario

Para más info: [Pricing de Resend](https://resend.com/pricing)

## 🔒 Seguridad

- ✅ La API key está en `.env.local` (no se sube a GitHub)
- ✅ Los webhooks de Stripe verifican la firma
- ✅ Los templates no exponen información sensible
- ✅ Los emails se envían desde un dominio verificado

## 🚀 Variables de Entorno Necesarias

Asegúrate de tener estas variables en tu `.env.local`:

```bash
# Resend (para envío de emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe (webhooks y pagos)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL de tu sitio
NEXT_PUBLIC_SITE_URL=https://holistia.io
```

## 📝 Personalización

### Modificar Templates

Los templates están en `database/email-templates/`. Para modificar:

1. Edita el archivo HTML correspondiente
2. Mantén los placeholders `{{variable_name}}`
3. Prueba el template antes de desplegar
4. Los cambios se reflejan inmediatamente (no requiere redeploy)

### Agregar Nuevos Tipos de Email

1. Crea un nuevo template en `database/email-templates/`
2. Agrega una interface en `src/lib/email-sender.ts`
3. Crea una función `send[TipoDeEmail]` en `email-sender.ts`
4. Llama la función desde donde necesites (webhook, API route, etc.)

## 🐛 Troubleshooting

### Los emails no se envían

1. Verifica que `RESEND_API_KEY` esté configurada
2. Revisa los logs del servidor para ver errores
3. Verifica que el dominio esté verificado en Resend
4. Revisa los logs en el dashboard de Resend

### Los emails llegan a spam

1. Asegúrate de tener un dominio verificado
2. Configura correctamente los registros DNS (SPF, DKIM, DMARC)
3. No uses palabras spam en el asunto
4. Incluye un link de "unsubscribe" si es email recurrente

### Error: "Template not found"

1. Verifica que el archivo exista en `database/email-templates/`
2. Verifica la ruta en la función de envío
3. Asegúrate de que el archivo tenga la extensión `.html`

## ✅ Checklist de Implementación

- [x] Instalar Resend (`pnpm add resend`)
- [x] Crear templates HTML con look and feel de Holistia
- [x] Actualizar `email-sender.ts` con funciones de Resend
- [x] Agregar llamadas en el webhook de Stripe
- [ ] **Crear cuenta en Resend**
- [ ] **Obtener API Key**
- [ ] **Agregar `RESEND_API_KEY` a `.env.local`**
- [ ] **Verificar dominio en Resend**
- [ ] **Probar envío de emails en local**
- [ ] **Configurar variable en Vercel**
- [ ] **Probar envío en producción**

## 📧 Soporte

Si tienes problemas con el sistema de emails:

1. Revisa esta documentación
2. Consulta los logs de Resend
3. Contacta soporte de Resend: [support@resend.com](mailto:support@resend.com)
4. Revisa la documentación oficial: [https://resend.com/docs](https://resend.com/docs)

---

**¡El sistema de tickets por email está listo! 🎉**

Solo falta configurar tu cuenta de Resend y empezar a enviar emails profesionales automáticamente.

