# Guía Rápida: Conectar Google Calendar a Holistia

## ¿Qué puedes hacer con esta integración?

✅ **Sincronización automática bidireccional**:
- Las citas que creas en Holistia aparecen automáticamente en tu Google Calendar
- Cuando reprogramas una cita, se actualiza en Google Calendar
- Cuando cancelas una cita, se elimina de Google Calendar
- Los eventos que crees también se sincronizan

## Paso 1: Conectar tu Cuenta de Google

1. **Ve a tu página de Configuración**:
   - En el sidebar, haz clic en "Configuración" (ícono de engranaje)
   - O ve directamente a: `/professional/[tu-id]/settings`

2. **Sección de Integraciones**:
   - Verás una card llamada "Google Calendar"
   - Haz clic en el botón **"Conectar Google Calendar"**

3. **Autoriza el acceso**:
   - Se abrirá una ventana de Google
   - Selecciona tu cuenta de Google
   - Acepta los permisos que solicita Holistia
   - Serás redirigido de vuelta a Holistia

4. **¡Listo!**:
   - Verás un mensaje de "✅ Conectado"
   - Ahora todas tus citas se sincronizarán automáticamente

## Paso 2: Usar la Integración

### Sincronización Automática

**No necesitas hacer nada más.** La integración funcionará automáticamente:

#### Cuando creas una cita:
- ✅ Se crea automáticamente en Google Calendar
- ✅ Incluye: título, hora, duración, ubicación
- ✅ Descripción con datos del paciente

#### Cuando confirmas una cita:
- ✅ Se actualiza en Google Calendar
- ✅ El evento refleja el cambio de estado

#### Cuando reprogramas una cita:
- ✅ Se actualiza la fecha/hora en Google Calendar
- ✅ Mantiene todos los detalles

#### Cuando cancelas una cita:
- ✅ Se elimina de Google Calendar automáticamente

### Sincronización Manual (Opcional)

Si quieres sincronizar todas tus citas existentes:

1. Ve a Configuración
2. En la sección de Google Calendar, haz clic en **"Sincronizar Todas las Citas"**
3. Espera unos segundos
4. ¡Todas tus citas estarán en Google Calendar!

## ¿Qué aparece en Google Calendar?

Cada cita se verá así:

**Título:** `Cita con [Nombre del Paciente]`  
**Fecha/Hora:** La que configuraste  
**Duración:** Según el servicio  
**Ubicación:** 
- Si es presencial: la dirección
- Si es en línea: "Consulta en línea"

**Descripción incluye:**
- Nombre del paciente
- Email y teléfono del paciente
- Tipo de consulta
- Notas adicionales

## Solución de Problemas

### "No se puede conectar"

**Verifica:**
1. Que estés usando una cuenta de Google válida
2. Que hayas aceptado todos los permisos
3. Si sigues teniendo problemas, contacta a: hola@holistia.io

### "Las citas no aparecen en Google Calendar"

**Solución:**
1. Ve a Configuración
2. Haz clic en "Sincronizar Todas las Citas"
3. Espera unos segundos
4. Revisa tu Google Calendar

### "Token expirado"

**Solución:**
1. Desconecta Google Calendar
2. Vuelve a conectar
3. Esto generará nuevos tokens

## Desconectar Google Calendar

Si en algún momento quieres desconectar:

1. Ve a Configuración
2. En la sección de Google Calendar
3. Haz clic en **"Desconectar"**
4. Confirma la acción

**Nota:** Desconectar NO eliminará los eventos ya creados en tu calendario, solo detendrá la sincronización futura.

## Privacidad y Seguridad

- ✅ Solo tú puedes ver y editar tus eventos
- ✅ Los tokens se almacenan de forma segura en la base de datos
- ✅ Holistia solo tiene acceso a tu calendario, no a otros datos de Google
- ✅ Puedes desconectar en cualquier momento

## ¿Necesitas ayuda?

Contacta a nuestro equipo: **hola@holistia.io**

