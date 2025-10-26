# 📧 Cómo Cambiar el Email de Confirmación a Español

## Problema
Los emails de confirmación llegan en inglés con el asunto "Confirm Your Signup".

## Solución
Ya tienes un template en español listo en: `database/email-templates/supabase-auth-confirm-signup.html`

Solo necesitas configurarlo en Supabase Dashboard.

---

## 📋 Pasos para Configurar

### 1. Acceder a Supabase Dashboard
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto de Holistia
3. En el menú lateral, ve a: **Authentication → Email Templates**

### 2. Configurar el Template "Confirm Signup"
1. En la lista de templates, selecciona **"Confirm signup"**
2. Verás un editor con el template actual en inglés

### 3. Copiar el Template en Español
1. Abre el archivo: `database/email-templates/supabase-auth-confirm-signup.html`
2. **Copia TODO el contenido** del archivo (desde `<!DOCTYPE html>` hasta `</html>`)
3. Vuelve a Supabase Dashboard
4. **Pega** el contenido en el editor, reemplazando completamente el template anterior

### 4. Configurar el Asunto del Email
En el campo "Subject" (Asunto), cambia de:
```
Confirm Your Signup
```

A:
```
Confirma tu cuenta en Holistia
```

### 5. Guardar los Cambios
1. Haz clic en el botón **"Save"** (Guardar)
2. ¡Listo! Los nuevos registros recibirán el email en español

---

## ✅ Resultado Esperado

Después de configurar, los usuarios recibirán un email con:

- **Asunto:** "Confirma tu cuenta en Holistia"
- **Contenido:**
  - Encabezado con el logo de Holistia
  - Mensaje de bienvenida: "¡Bienvenido a Holistia! 🌟"
  - Texto completamente en español
  - Botón: "Confirmar mi cuenta"
  - Footer con información de contacto

---

## 🎨 Vista Previa del Email

El email incluirá:

```
┌─────────────────────────────────┐
│   🎨 Holistia (con gradiente)   │
├─────────────────────────────────┤
│                                 │
│ ¡Bienvenido a Holistia! 🌟     │
│                                 │
│ Hola,                           │
│                                 │
│ Gracias por unirte a Holistia, │
│ tu plataforma de bienestar      │
│ integral...                     │
│                                 │
│   [Confirmar mi cuenta] 🔘     │
│                                 │
│ Si no creaste una cuenta...     │
│                                 │
├─────────────────────────────────┤
│ Holistia                        │
│ holistia.io | hola@holistia.io  │
│ © 2025 Holistia                 │
└─────────────────────────────────┘
```

---

## 🔧 Otros Templates que También Puedes Cambiar

Ya tienes templates en español listos para:

### Reset Password (Restablecer Contraseña)
- **Archivo:** `database/email-templates/reset-password.html`
- **Asunto sugerido:** "Restablece tu contraseña en Holistia"

### Magic Link (Enlace Mágico)
- **Archivo:** `database/email-templates/confirm-signup.html`
- **Asunto sugerido:** "Inicia sesión en Holistia"

Para cambiarlos, sigue los mismos pasos pero selecciona el template correspondiente en Supabase Dashboard.

---

## 🧪 Probar el Cambio

1. Crea un nuevo usuario de prueba
2. Verifica tu email
3. Deberías recibir el email completamente en español

**Ejemplo de prueba:**
```javascript
// En la consola del navegador o usando Supabase
supabase.auth.signUp({
  email: 'prueba@ejemplo.com',
  password: 'TestPassword123!'
})
```

---

## ⚠️ Nota Importante

- Los cambios solo afectan a **nuevos emails** enviados después de guardar
- Los usuarios que ya recibieron emails no se verán afectados
- Si usas SMTP personalizado (Resend), asegúrate de que esté configurado correctamente

---

## 📸 Capturas de Pantalla de Referencia

### Ubicación en Supabase:
```
Dashboard → Authentication → Email Templates → Confirm signup
```

### Campos a configurar:
1. **Subject:** Confirma tu cuenta en Holistia
2. **Body:** [Pegar contenido del archivo HTML]
3. **Sender name:** Holistia (opcional, si tienes SMTP configurado)

---

## 🚀 Próximos Pasos Opcionales

### 1. Configurar SMTP Personalizado (Recomendado)
Si quieres que los emails lleguen desde `noreply@holistia.io` en lugar de Supabase:
- Consulta: `docs/GUIA_CONFIGURAR_EMAILS_SUPABASE.md`

### 2. Agregar Logo de Holistia
1. Sube el logo a Supabase Storage
2. Obtén la URL pública
3. Modifica el template para incluir:
```html
<img src="URL_DEL_LOGO" alt="Holistia" style="width: 150px;">
```

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Verifica que copiaste TODO el contenido HTML
2. Asegúrate de que guardaste los cambios
3. Prueba con un nuevo registro (no con usuarios existentes)
4. Revisa los logs en: Supabase Dashboard → Logs → Auth

---

**Última actualización:** 2025-10-25
