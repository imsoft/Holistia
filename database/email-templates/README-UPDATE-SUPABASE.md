# Cómo Actualizar Templates de Email en Supabase

## Template de Restablecer Contraseña

Para actualizar el template de "Restablecer Contraseña" en Supabase:

1. Ve a tu proyecto en Supabase Dashboard
2. En el menú lateral, ve a **Authentication** → **Email Templates**
3. Selecciona el template **"Reset Password"** o **"Recovery Email"**
4. Copia todo el contenido del archivo `reset-password.html`
5. Pégalo en el editor de Supabase
6. Asegúrate de que la variable `{{ .ConfirmationURL }}` esté presente
7. Haz clic en **Save**

## Cambios Realizados

- ✅ Agregado título "Holistia" en texto blanco visible
- ✅ Mejorado el fallback cuando las imágenes están bloqueadas
- ✅ Ahora el header se ve bien incluso sin imágenes

## Nota Importante

Supabase usa variables de template Go:
- `{{ .ConfirmationURL }}` - URL de confirmación
- `{{ .Token }}` - Token de verificación
- `{{ .Email }}` - Email del usuario
- `{{ .SiteURL }}` - URL del sitio

No modifiques estas variables al copiar el template.
