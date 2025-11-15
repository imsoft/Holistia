# Agregar Scope de Google Calendar a la Pantalla de Consentimiento

## 🎯 Problema

Tu app está **verificada** ✅, pero en la sección **"Acceso a los datos"** no aparece ningún permiso configurado. Esto puede causar que algunos usuarios aún vean advertencias.

## ✅ Solución: Agregar el Scope de Google Calendar

### Paso 1: Ir a "Acceso a los datos"

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto **"Holistia"**
3. En el menú lateral, ve a **Google Auth Platform** > **Acceso a los datos**

### Paso 2: Agregar el Scope

1. Haz clic en el botón **"Agregar o quitar permisos"** (botón azul)
2. Se abrirá un modal/diálogo para buscar y agregar scopes

### Paso 3: Buscar y Seleccionar Google Calendar

1. En el campo de búsqueda, escribe: **"Google Calendar API"**
2. O busca directamente: **"calendar"**
3. Selecciona **"Google Calendar API"**
4. En la lista de scopes, busca y selecciona:
   - ✅ **`https://www.googleapis.com/auth/calendar`**
   - Descripción: "Ver, editar, compartir y borrar permanentemente todos los calendarios a los que puedes acceder mediante el Calendario de Google"

### Paso 4: Guardar

1. Haz clic en **"Actualizar"** o **"Guardar"**
2. Confirma los cambios

### Paso 5: Verificar

1. Vuelve a la página **"Acceso a los datos"**
2. Deberías ver el scope de Google Calendar en la sección **"Tus permisos sensibles"** 🔒
3. El scope aparecerá con un ícono de candado porque es un permiso sensible

## 📋 Información que Verás

Después de agregar el scope, verás:

- **API**: Google Calendar API
- **Alcance**: `https://www.googleapis.com/auth/calendar`
- **Descripción para el usuario**: "Ver, editar, compartir y borrar permanentemente todos los calendarios a los que puedes acceder mediante el Calendario de Google"

## ⚠️ Nota Importante

- Este scope es **sensible** 🔒, por eso aparece en la sección "Tus permisos sensibles"
- Como tu app ya está **verificada**, no necesitas volver a solicitar verificación solo por agregar este scope
- Los usuarios verán este permiso en la pantalla de consentimiento cuando conecten su calendario

## ✅ Resultado Esperado

Una vez agregado el scope:

1. ✅ El scope aparecerá en "Acceso a los datos"
2. ✅ Los usuarios verán el permiso claramente en la pantalla de consentimiento
3. ✅ Como tu app está verificada, no verán la advertencia "app no verificada"
4. ✅ El límite de 100 usuarios desaparecerá (ya que la app está verificada)

## 🔍 Verificación Rápida

Para verificar que todo está correcto:

1. Ve a **Google Auth Platform** > **Centro de verificación**
2. Deberías ver: **"Verificada"** ✅
3. Ve a **Acceso a los datos**
4. Deberías ver el scope de Google Calendar en **"Tus permisos sensibles"**

---

**¿Problemas?** Si no puedes agregar el scope o tienes algún error, verifica que:
- Tu app esté en estado "En producción" (no en "Prueba")
- Tengas permisos de editor o propietario en el proyecto
- La API de Google Calendar esté habilitada

