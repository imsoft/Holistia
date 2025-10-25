# 📧 Configurar Emails de Supabase - Holistia

## Problema

Los emails de autenticación llegan como **"Supabase Auth <noreply@mail.app.supabase...>"**

Queremos que lleguen como **"Holistia <noreply@holistia.io>"**

---

## ✅ Solución Rápida (2 minutos)

### Paso 1: Cambiar Sender Name

1. **Ve a Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Proyecto Holistia

2. **Authentication → Email Templates**

3. **Para cada template** (Confirm signup, Reset password, Magic Link, etc.):
   - Busca el campo **"Sender name"**
   - Cambia: `Supabase Auth` → `Holistia`
   - Click **Save**

**Resultado:**
```
Antes: Supabase Auth <noreply@mail.app.supabase...>
Ahora: Holistia <noreply@mail.app.supabase...>
```

---

## 🚀 Solución Completa (15 minutos)

Para cambiar **completamente** el remitente (nombre + email):

### Opción A: Usar Resend como SMTP

#### 1. Verificar Dominio en Resend

1. **Ve a Resend Dashboard:**
   - https://resend.com/domains

2. **Add Domain:**
   - Click "Add Domain"
   - Ingresa: `holistia.io`

3. **Agregar Registros DNS:**

Resend te dará registros DNS que debes agregar. Ejemplo:

```
MX      @       feedback-smtp.us-east-1.amazonses.com   10
TXT     @       "v=spf1 include:amazonses.com ~all"
CNAME   resend._domainkey   resend._domainkey.holistia.io.resend.com
```

**¿Dónde agregar los registros DNS?**
- Si usas **Vercel Domains**: Vercel Dashboard → Domains → DNS
- Si usas **Namecheap/GoDaddy**: Panel de control del dominio
- Si usas **Cloudflare**: Cloudflare Dashboard → DNS

4. **Esperar Verificación:**
   - Puede tardar 1-48 horas
   - Resend verificará automáticamente

#### 2. Obtener Credenciales SMTP

1. **En Resend Dashboard:**
   - Settings → **SMTP**
   - Click "Generate SMTP Credentials"

2. **Copiar credenciales:**
   ```
   Host: smtp.resend.com
   Port: 587 (TLS) o 465 (SSL)
   Username: resend
   Password: [tu API key, empieza con re_]
   ```

#### 3. Configurar en Supabase

1. **Supabase Dashboard:**
   - Project Settings → **Auth**
   - Scroll down a **SMTP Settings**

2. **Habilitar Custom SMTP:**
   - Toggle **"Enable Custom SMTP"** → ON

3. **Ingresar credenciales:**
   ```
   Host: smtp.resend.com
   Port Number: 587
   Username: resend
   Password: re_tu_api_key_aqui
   Sender email: noreply@holistia.io
   Sender name: Holistia
   ```

4. **Save** → **Test Connection**

**Resultado:**
```
Antes: Supabase Auth <noreply@mail.app.supabase...>
Ahora: Holistia <noreply@holistia.io>
```

---

### Opción B: Usar Gmail como SMTP

Si no quieres configurar dominio, puedes usar Gmail temporalmente:

1. **Habilitar 2FA en Gmail:**
   - https://myaccount.google.com/security

2. **Generar App Password:**
   - https://myaccount.google.com/apppasswords
   - Nombre: "Holistia Supabase"
   - Copiar la contraseña de 16 caracteres

3. **Configurar en Supabase:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: holistia.io@gmail.com
   Password: [app password de 16 caracteres]
   Sender email: holistia.io@gmail.com
   Sender name: Holistia
   ```

⚠️ **Limitaciones de Gmail:**
- Máximo 100 emails/día
- Puede ir a spam
- No profesional

---

## 🎨 Aplicar Templates Personalizados

Ya tienes templates con diseño Holistia en `database/email-templates/`.

### Para Confirm Signup

1. **Supabase → Authentication → Email Templates**
2. **Selecciona "Confirm signup"**
3. **Subject:** `Confirma tu cuenta en Holistia`
4. **Message body:**
   - Click **"< > Source"** (vista de código)
   - **Borra todo**
   - Copia el contenido de `database/email-templates/confirm-signup.html`
   - Pega en el editor
   - **Save**

### Para Reset Password

1. **Selecciona "Reset Password"**
2. **Subject:** `Restablecer tu contraseña - Holistia`
3. **Message body:**
   - Click **"< > Source"**
   - **Borra todo**
   - Copia `database/email-templates/reset-password.html`
   - Pega
   - **Save**

### Para Magic Link

1. **Selecciona "Magic Link"**
2. **Subject:** `Tu enlace de acceso a Holistia`
3. Puedes usar el template de `confirm-signup.html` y modificar el texto

---

## 📋 Checklist Completo

### Nivel 1: Cambiar Solo el Nombre (2 min)

- [ ] Cambiar "Sender name" a "Holistia" en Confirm signup
- [ ] Cambiar "Sender name" a "Holistia" en Reset password
- [ ] Cambiar "Sender name" a "Holistia" en Magic Link
- [ ] Cambiar "Sender name" a "Holistia" en Change Email
- [ ] Cambiar "Sender name" a "Holistia" en Invite User

**Resultado:** `Holistia <noreply@mail.app.supabase...>`

---

### Nivel 2: Templates Personalizados (10 min)

- [ ] Aplicar template `confirm-signup.html`
- [ ] Aplicar template `reset-password.html`
- [ ] Verificar que el diseño se vea bien (Preview)

**Resultado:** Emails con diseño y branding de Holistia

---

### Nivel 3: SMTP Personalizado (30-60 min)

- [ ] Verificar dominio en Resend
- [ ] Agregar registros DNS
- [ ] Esperar verificación
- [ ] Generar credenciales SMTP
- [ ] Configurar SMTP en Supabase
- [ ] Test connection
- [ ] Enviar email de prueba

**Resultado:** `Holistia <noreply@holistia.io>` ✨

---

## 🧪 Testing

### Probar Confirm Signup

```bash
# 1. Crear cuenta nueva con email temporal
# Usa: https://temp-mail.org/

# 2. Verificar email recibido
# - Remitente debe ser "Holistia"
# - Diseño debe ser el template personalizado
```

### Probar Reset Password

1. **En tu app:** Olvidé mi contraseña
2. Ingresa email
3. Verifica el email recibido

---

## 🎯 Recomendaciones

### Prioridad 1 (Hacer YA)
✅ Cambiar Sender name a "Holistia" (2 min)

### Prioridad 2 (Hacer esta semana)
✅ Aplicar templates personalizados (10 min)

### Prioridad 3 (Hacer cuando tengas tiempo)
⏳ Configurar SMTP personalizado con dominio (30-60 min)

---

## 🔗 Links Útiles

- **Supabase Auth Settings:** https://supabase.com/dashboard/project/_/auth/templates
- **Resend Dashboard:** https://resend.com/dashboard
- **Resend Domains:** https://resend.com/domains
- **Supabase SMTP Docs:** https://supabase.com/docs/guides/auth/auth-smtp

---

## 🆘 Troubleshooting

### "Test connection failed"

**Causa:** Credenciales incorrectas

**Solución:**
1. Verificar que copiaste correctamente:
   - Host
   - Port
   - Username
   - Password (sin espacios extras)
2. Verificar que el dominio esté verificado en Resend

---

### Emails van a spam

**Solución:**
1. Verificar dominio en Resend
2. Agregar todos los registros DNS (SPF, DKIM, DMARC)
3. Esperar 24-48 horas
4. Usar "Send a test email" desde Resend

---

### "Domain not verified"

**Causa:** Registros DNS no se han propagado

**Solución:**
1. Verificar que agregaste los registros correctos
2. Esperar 1-48 horas (propagación DNS)
3. Verificar registros:
   ```bash
   # Verificar MX
   dig MX holistia.io
   
   # Verificar TXT
   dig TXT holistia.io
   
   # Verificar DKIM
   dig CNAME resend._domainkey.holistia.io
   ```

---

## ✅ Resultado Final

Con todo configurado, los emails llegarán así:

```
De: Holistia <noreply@holistia.io>
Asunto: Confirma tu cuenta en Holistia

[Email con diseño personalizado Holistia]
- Logo de Holistia
- Colores morados
- Diseño profesional
- Footer con links
```

¡Mucho más profesional! 🎉

