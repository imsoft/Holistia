# Configurar Emails como "Holistia"

## 📧 Problema Actual

Los emails llegan como **"Supabase Auth"** en lugar de **"Holistia"**.

## 🎯 Solución Completa

Hay **2 tipos de emails** en Holistia que necesitan configurarse por separado:

---

## 1️⃣ EMAILS DE TICKETS/PAGOS (Resend)

### ✅ Qué emails son estos:
- 🎟️ Ticket de cita (cuando un paciente paga)
- 🎟️ Ticket de evento (cuando alguien se registra a un evento)
- 🧾 Recibo de inscripción (cuando un profesional paga su inscripción)

### 📝 Cómo configurarlos:

#### Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta (es gratis, 3,000 emails/mes)
3. Verifica tu email

#### Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre: "Holistia Production"
4. **Copia la API key** (solo se muestra una vez)

#### Paso 3: Agregar a tu proyecto

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# En: /Users/brangarciaramos/Proyectos/holistia/.env.local

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:** Reemplaza `re_xxxxx` con tu API key real de Resend.

#### Paso 4: Verificar tu dominio (Recomendado)

En Resend:

1. Ve a **Domains** → **Add Domain**
2. Agrega: `holistia.io`
3. Copia los registros DNS que te dan
4. Ve a tu proveedor de dominio (GoDaddy, Namecheap, etc.)
5. Agrega estos registros DNS:

```
Tipo: MX
Host: @
Valor: [el que te da Resend]
Prioridad: 10

Tipo: TXT (SPF)
Host: @
Valor: [el que te da Resend]

Tipo: TXT (DKIM)
Host: [el que te da Resend]
Valor: [el que te da Resend]

Tipo: CNAME (DKIM)
Host: [el que te da Resend]
Valor: [el que te da Resend]
```

6. Espera la verificación (5 minutos a 72 horas)

#### Paso 5: Configurar en Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega:
   - Name: `RESEND_API_KEY`
   - Value: `tu_api_key_de_resend`
4. Haz clic en **Save**
5. Redespliega el proyecto

### ✅ Resultado:

Los emails de tickets llegarán como:
```
De: Holistia <noreply@holistia.io>
Asunto: 🎟️ Tu Ticket de Cita con [Profesional] | Holistia
```

---

## 2️⃣ EMAILS DE AUTENTICACIÓN (Supabase Auth)

### ✅ Qué emails son estos:
- 📧 Confirmación de cuenta (al registrarse)
- 🔑 Reset de contraseña
- ✉️ Confirmación de email
- 🔐 Magic links

### 📝 Cómo configurarlos:

#### Opción A: Cambiar el nombre en Supabase (Básico)

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto de Holistia
3. Ve a **Authentication** → **Email Templates**
4. Edita cada template y cambia:

**De:**
```
{{ .SiteURL }}
```

**A:**
```
Holistia
```

**Y el remitente (si puedes) de:**
```
noreply@mail.app.supabase.io
```

**A:**
```
noreply@holistia.io
```

#### Opción B: Usar SMTP personalizado (Avanzado)

Si quieres control total sobre los emails de autenticación:

1. En Supabase Dashboard, ve a **Project Settings** → **Auth**
2. Desplázate hasta **SMTP Settings**
3. Habilita **Enable Custom SMTP**
4. Configura con un proveedor SMTP:

**Opción 1: Usar Resend como SMTP**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [tu_api_key_de_resend]
Sender Email: noreply@holistia.io
Sender Name: Holistia
```

**Opción 2: Usar SendGrid**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [tu_api_key_de_sendgrid]
Sender Email: noreply@holistia.io
Sender Name: Holistia
```

**Opción 3: Usar Gmail (Solo para testing)**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: holistia.io@gmail.com
SMTP Password: [tu_app_password]
Sender Email: holistia.io@gmail.com
Sender Name: Holistia
```

5. Haz clic en **Save**
6. Haz un test enviándote un email de reset de contraseña

### ✅ Resultado:

Los emails de autenticación llegarán como:
```
De: Holistia <noreply@holistia.io>
Asunto: Confirma tu email | Holistia
```

---

## 🎨 Personalizar Templates de Supabase

Para que los emails de autenticación tengan el look & feel de Holistia:

1. Ve a **Authentication** → **Email Templates** en Supabase
2. Edita cada template:
   - **Confirm Signup**
   - **Magic Link**
   - **Change Email**
   - **Reset Password**

3. Puedes usar HTML personalizado. Ejemplo:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://holistia.io/logos/holistia-black.png" alt="Holistia" width="80">
      <h1>Bienvenido a Holistia</h1>
    </div>
    <p>Hola,</p>
    <p>Haz clic en el botón para confirmar tu email:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirmar Email</a>
    </p>
    <p style="color: #6b7280; font-size: 14px;">
      Si no creaste esta cuenta, puedes ignorar este email.
    </p>
  </div>
</body>
</html>
```

---

## 📊 Checklist Completo

### Para Emails de Tickets (Resend):
- [ ] Crear cuenta en Resend
- [ ] Obtener API Key
- [ ] Crear archivo `.env.local` con `RESEND_API_KEY`
- [ ] Verificar dominio `holistia.io` en Resend
- [ ] Agregar `RESEND_API_KEY` a Vercel
- [ ] Probar enviando un ticket de prueba

### Para Emails de Autenticación (Supabase):
- [ ] Cambiar nombre del remitente en templates de Supabase
- [ ] (Opcional) Configurar SMTP personalizado
- [ ] (Opcional) Personalizar templates HTML
- [ ] Probar con reset de contraseña

---

## 🧪 Cómo Probar

### Probar Emails de Tickets:

1. Asegúrate de tener `RESEND_API_KEY` en `.env.local`
2. Reinicia tu servidor local: `pnpm dev`
3. Haz una compra de prueba (cita, evento, o inscripción)
4. Revisa tu email - debería llegar de "Holistia"

### Probar Emails de Autenticación:

1. Ve a tu app en modo incógnito
2. Intenta registrarte con un nuevo email
3. O intenta resetear tu contraseña
4. Revisa el email - debería llegar de "Holistia"

---

## 💰 Costos

### Resend:
- **Plan Gratuito:** 3,000 emails/mes (suficiente para empezar)
- **Plan Pro:** $20/mes = 50,000 emails/mes

### Supabase Auth:
- **Incluido** en tu plan de Supabase (sin costo adicional)
- Si usas SMTP personalizado, los costos son del proveedor SMTP que elijas

---

## 🐛 Troubleshooting

### "Los emails siguen llegando como Supabase Auth"

**Para tickets:**
- ✅ Verifica que `RESEND_API_KEY` esté configurada
- ✅ Revisa los logs del servidor para ver si hay errores
- ✅ Asegúrate de que el dominio esté verificado en Resend

**Para autenticación:**
- ✅ Configura SMTP personalizado en Supabase
- ✅ O edita los templates en Supabase para cambiar el remitente

### "Los emails llegan a spam"

- ✅ Verifica tu dominio en Resend
- ✅ Configura correctamente SPF, DKIM y DMARC
- ✅ No uses palabras como "gratis", "promoción" en asuntos

### "Error al enviar emails"

- ✅ Revisa que la API key sea correcta
- ✅ Verifica los logs en Resend Dashboard
- ✅ Asegúrate de tener créditos/emails disponibles

---

## 📞 Soporte

- **Resend:** [support@resend.com](mailto:support@resend.com) o [docs](https://resend.com/docs)
- **Supabase:** [support@supabase.com](mailto:support@supabase.com) o [docs](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**¡Con estos pasos, todos tus emails llegarán como "Holistia"! 🎉**

