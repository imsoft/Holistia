# Plantillas de Email de Holistia

Esta carpeta contiene las plantillas de email personalizadas para Supabase Auth.

## 📧 Plantillas Disponibles

### `confirm-signup.html`
Plantilla para el email de confirmación de registro.

**Características:**
- ✅ Diseño moderno con gradiente morado de Holistia
- ✅ Responsive (se adapta a móviles)
- ✅ Botón de confirmación destacado
- ✅ Pasos siguientes claros
- ✅ Footer con links útiles
- ✅ Información de contacto

### `reset-password.html`
Plantilla para el email de restablecimiento de contraseña.

**Características:**
- ✅ Diseño consistente con confirm-signup
- ✅ Botón de restablecimiento destacado
- ✅ Alertas de seguridad destacadas (amarillo)
- ✅ Consejos de seguridad para contraseñas
- ✅ Mensaje claro sobre expiración (1 hora)
- ✅ Información de contacto de soporte

## 🚀 Cómo Aplicar las Plantillas en Supabase

### Paso 1: Acceder a Email Templates

1. Ve a tu **Dashboard de Supabase**: https://supabase.com/dashboard
2. Selecciona tu proyecto **Holistia**
3. Ve a **Authentication** en el menú lateral
4. Click en **Email Templates**

### Paso 2A: Configurar la Plantilla de Confirmación de Registro

1. En la pestaña **Email Templates**, selecciona **"Confirm signup"**
2. En el campo **"Subject heading"**, pon:
   ```
   Confirma tu cuenta en Holistia
   ```

3. En el campo **"Message body"**, haz click en **"< > Source"** (vista de código)
4. **Borra todo** el contenido actual
5. **Copia y pega** el contenido completo del archivo `confirm-signup.html`
6. Haz click en **"Save"**

### Paso 2B: Configurar la Plantilla de Restablecimiento de Contraseña

1. En la pestaña **Email Templates**, selecciona **"Reset Password"**
2. En el campo **"Subject heading"**, pon:
   ```
   Restablecer tu contraseña - Holistia
   ```

3. En el campo **"Message body"**, haz click en **"< > Source"** (vista de código)
4. **Borra todo** el contenido actual
5. **Copia y pega** el contenido completo del archivo `reset-password.html`
6. Haz click en **"Save"**

### Paso 3: Verificar la Plantilla

1. Haz click en **"Preview"** para ver cómo se ve
2. Verifica que:
   - ✅ El logo y gradiente se vean correctos
   - ✅ El botón "Confirmar mi correo" esté visible
   - ✅ Los colores morados de Holistia estén presentes
   - ✅ El footer tenga los links correctos

### Paso 4: Probar el Email

1. Crea una cuenta de prueba en tu aplicación
2. Revisa el email recibido
3. Verifica que el diseño se vea profesional y coherente con la marca

## 🎨 Colores Utilizados

La plantilla usa los colores de la marca Holistia:

- **Primary/Morado**: `#8B5CF6` → `#7C3AED` (gradiente)
- **Texto oscuro**: `#1f2937`
- **Texto medio**: `#4b5563`
- **Texto claro**: `#6b7280`
- **Fondo**: `#f9fafb`
- **Card**: `#ffffff`

## 📝 Variables Disponibles de Supabase

Las plantillas de Supabase soportan estas variables:

- `{{ .ConfirmationURL }}` - URL de confirmación
- `{{ .Token }}` - Token de confirmación
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio
- `{{ .Email }}` - Email del usuario
- `{{ .Data }}` - Datos adicionales

## 🔧 Personalización

Si quieres modificar la plantilla:

1. **Cambiar el asunto**: Edita "Confirm Your Signup" en el Subject heading
2. **Modificar colores**: Busca y reemplaza los valores hex (`#8B5CF6`, etc.)
3. **Agregar/quitar secciones**: Edita el HTML directamente
4. **Cambiar textos**: Modifica los párrafos y títulos

## 📱 Compatibilidad

Las plantillas están optimizadas para:
- ✅ Gmail (móvil y desktop)
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Otros clientes de email modernos

## 🎯 Mejores Prácticas

1. **Usa tablas** para el layout (mejor compatibilidad)
2. **Inline styles** únicamente (no CSS externo)
3. **Evita JavaScript** (bloqueado por clientes de email)
4. **Prueba en múltiples clientes** antes de publicar
5. **Mantén el HTML simple** y limpio

## 🔗 Enlaces Útiles

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email on Acid](https://www.emailonacid.com/) - Testing de emails
- [Can I Email](https://www.caniemail.com/) - Compatibilidad de features

## ⚠️ Notas Importantes

- Los emails pueden tardar unos minutos en llegar
- Verifica la carpeta de spam si no recibes el email
- Asegúrate de tener configurado el SMTP en Supabase
- Las plantillas se aplican inmediatamente después de guardar

