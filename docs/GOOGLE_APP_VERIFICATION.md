# Guía para Verificar la App de Google Calendar con Google

Esta guía te ayudará a solicitar la **verificación oficial de tu app** con Google, lo que eliminará la advertencia "Google no verificó esta app" para todos los usuarios.

## ⚠️ Diferencia Importante

- **✅ API Habilitada** (Ya lo tienes): Permite usar la API de Google Calendar
- **❌ App Verificada** (Necesitas esto): Elimina la advertencia y permite que todos los usuarios conecten sin restricciones

---

## 📋 Requisitos Previos

Antes de solicitar la verificación, asegúrate de tener:

1. ✅ **API de Google Calendar habilitada** (Ya lo tienes)
2. ✅ **Pantalla de consentimiento OAuth configurada**
3. ✅ **Política de Privacidad pública** (URL accesible)
4. ✅ **Términos de Servicio públicos** (URL accesible)
5. ✅ **Dominio verificado** (holistia.io)
6. ✅ **Logo de la aplicación** (opcional pero recomendado)

---

## 🚀 Paso 1: Configurar la Pantalla de Consentimiento OAuth

### 1.1 Acceder a la Pantalla de Consentimiento

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto **"Holistia"**
3. En el menú lateral, ve a **APIs y Servicios** > **Pantalla de consentimiento de OAuth**

### 1.2 Completar la Información Básica

Si aún no has configurado la pantalla de consentimiento, completa:

- **Tipo de usuario**: **Externo** (para que cualquier usuario pueda usar la app)
- **Nombre de la aplicación**: `Holistia`
- **Correo de asistencia**: `hola@holistia.io` (o tu email de soporte)
- **Logo de la aplicación**: Sube el logo de Holistia (recomendado: 120x120px)
- **Dominio de la aplicación**: `https://holistia.io`
- **Dominios autorizados**: `holistia.io`
- **Información de contacto del desarrollador**: `holistia.io@gmail.com`

### 1.3 Configurar Alcances (Scopes)

1. Haz clic en **"Agregar o quitar alcances"**
2. Agrega el siguiente alcance:
   - `https://www.googleapis.com/auth/calendar`
3. Haz clic en **"Guardar y Continuar"**

### 1.4 Agregar Usuarios de Prueba (Temporal)

Mientras esperas la verificación, agrega usuarios de prueba:

1. En la sección **"Usuarios de prueba"**
2. Haz clic en **"+ Agregar usuarios"**
3. Agrega los emails de los profesionales que quieras probar
4. Estos usuarios podrán conectar sin advertencia

---

## 📝 Paso 2: Preparar Documentación Requerida

Google requiere los siguientes documentos para verificar tu app:

### 2.1 Política de Privacidad

**Requisitos:**
- ✅ Debe estar **pública** y accesible desde una URL
- ✅ Debe explicar **qué datos recopilas** de Google Calendar
- ✅ Debe explicar **cómo usas** esos datos
- ✅ Debe explicar **cómo proteges** los datos
- ✅ Debe incluir información de contacto

**URL sugerida:** `https://holistia.io/privacy`

**Ejemplo de contenido necesario:**
```
- Qué datos recopilamos: Acceso al calendario de Google para sincronizar citas
- Cómo usamos los datos: Solo para crear, actualizar y eliminar eventos en el calendario
- Cómo protegemos los datos: Tokens encriptados, acceso solo a calendarios del usuario
- Información de contacto: hola@holistia.io
```

### 2.2 Términos de Servicio

**Requisitos:**
- ✅ Debe estar **público** y accesible desde una URL
- ✅ Debe explicar las condiciones de uso del servicio
- ✅ Debe mencionar el uso de Google Calendar

**URL sugerida:** `https://holistia.io/terms`

### 2.3 Video Demo (Opcional pero Recomendado)

Google puede pedir un video que muestre:
- Cómo funciona la integración con Google Calendar
- Cómo se solicitan los permisos
- Cómo se usan los datos del calendario

**Duración sugerida:** 2-5 minutos
**Formato:** YouTube, Vimeo, o enlace directo

---

## 🔍 Paso 3: Verificar el Estado Actual

Antes de solicitar la verificación, verifica tu estado:

1. Ve a **APIs y Servicios** > **Pantalla de consentimiento de OAuth**
2. Revisa el estado actual:
   - **"En prueba"**: Solo usuarios de prueba pueden usar la app
   - **"Publicado"**: Cualquiera puede usar, pero con advertencia
   - **"Verificado"**: Sin advertencias (esto es lo que quieres)

---

## 📤 Paso 4: Solicitar la Verificación

### 4.1 Publicar la App

1. En la **Pantalla de consentimiento de OAuth**
2. Haz clic en **"PUBLICAR APP"** (botón azul en la parte superior)
3. Confirma que quieres publicar la app
4. Esto cambiará el estado a **"Publicado"** (pero aún con advertencia)

### 4.2 Solicitar Verificación

1. Después de publicar, verás un banner o botón que dice **"Solicitar verificación"**
2. Haz clic en **"Solicitar verificación"**
3. Se abrirá un formulario con varias secciones

### 4.3 Completar el Formulario de Verificación

El formulario incluye:

#### Sección 1: Información de la App
- Nombre de la app: `Holistia`
- Email de soporte: `hola@holistia.io`
- URL de la app: `https://holistia.io`

#### Sección 2: Alcances Solicitados
- Explica **por qué necesitas** acceso a `https://www.googleapis.com/auth/calendar`

**Ejemplo de explicación:**
```
Holistia es una plataforma de salud holística que conecta profesionales 
con pacientes. Necesitamos acceso al calendario de Google para:

1. Sincronizar automáticamente las citas creadas en Holistia con el 
   calendario del profesional
2. Permitir que los profesionales gestionen sus citas desde su 
   calendario de Google
3. Evitar conflictos de horarios entre citas y otros eventos del calendario

Los datos del calendario solo se usan para estos fines y nunca se 
comparten con terceros.
```

#### Sección 3: URLs de Documentación
- **Política de Privacidad**: `https://holistia.io/privacy`
- **Términos de Servicio**: `https://holistia.io/terms`
- **Página de inicio**: `https://holistia.io`

#### Sección 4: Video Demo (Opcional)
- Si tienes un video, agrega la URL aquí

#### Sección 5: Información Adicional
- Explica cualquier detalle adicional sobre el uso de los datos

### 4.4 Enviar la Solicitud

1. Revisa toda la información
2. Haz clic en **"Enviar para verificación"**
3. Recibirás un email de confirmación

---

## ⏳ Paso 5: Proceso de Revisión

### Tiempo Estimado
- **Revisión inicial**: 1-3 días
- **Revisión completa**: 1-2 semanas
- **Si hay problemas**: Puede tomar más tiempo

### Estados del Proceso

1. **"En revisión"**: Google está revisando tu solicitud
2. **"Se requiere más información"**: Google necesita más detalles
3. **"Aprobado"**: ✅ Tu app está verificada
4. **"Rechazado"**: Necesitas corregir problemas y volver a solicitar

### Comunicación con Google

- Google se comunicará contigo por email
- Revisa tu bandeja de entrada regularmente
- Si piden más información, responde lo antes posible

---

## ✅ Paso 6: Después de la Verificación

Una vez que Google apruebe tu app:

1. **El estado cambiará a "Verificado"**
2. **La advertencia desaparecerá** para todos los usuarios
3. **No habrá límite de usuarios** (ya no necesitas usuarios de prueba)
4. **Todos los profesionales** podrán conectar su calendario sin problemas

---

## 🔧 Solución de Problemas

### Error: "App no cumple con los requisitos"

**Posibles causas:**
- Política de privacidad no accesible
- Términos de servicio faltantes
- Explicación insuficiente del uso de datos

**Solución:**
- Verifica que todas las URLs sean accesibles
- Mejora la explicación del uso de datos
- Asegúrate de que la política de privacidad mencione Google Calendar

### Error: "Se requiere más información"

**Solución:**
- Responde a las preguntas de Google lo más detalladamente posible
- Proporciona ejemplos de uso si es necesario
- Incluye capturas de pantalla si te las piden

### La Verificación Tarda Mucho

**Solución:**
- Es normal que tarde 1-2 semanas
- No envíes múltiples solicitudes (esto puede retrasar el proceso)
- Si pasa más de 2 semanas, contacta a Google Support

---

## 📚 Recursos Adicionales

- [Google OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
- [OAuth Consent Screen Documentation](https://developers.google.com/identity/protocols/oauth2/policy)
- [Google API Verification FAQ](https://support.google.com/cloud/answer/7454865)

---

## 🎯 Checklist Final

Antes de solicitar la verificación, asegúrate de tener:

- [ ] API de Google Calendar habilitada
- [ ] Pantalla de consentimiento OAuth completamente configurada
- [ ] Política de privacidad pública y accesible
- [ ] Términos de servicio públicos y accesibles
- [ ] Logo de la aplicación subido
- [ ] Dominio verificado (holistia.io)
- [ ] Explicación clara del uso de datos del calendario
- [ ] Video demo (opcional pero recomendado)
- [ ] Email de soporte configurado y funcionando

---

## 💡 Consejos

1. **Sé específico**: Explica exactamente cómo usas los datos del calendario
2. **Sé transparente**: Menciona claramente qué datos accedes y por qué
3. **Documenta bien**: Asegúrate de que tu política de privacidad sea clara
4. **Responde rápido**: Si Google pide más información, responde lo antes posible
5. **Ten paciencia**: El proceso puede tardar, pero vale la pena

---

**¿Necesitas ayuda?** Si tienes problemas durante el proceso, revisa la documentación de Google o contacta a su soporte.

