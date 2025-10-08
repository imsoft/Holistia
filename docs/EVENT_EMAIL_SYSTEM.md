# Sistema de Emails de Confirmación para Eventos

## 📧 Funcionalidad Implementada

Se ha implementado un sistema completo de envío de emails automáticos cuando un usuario paga exitosamente por un evento. El sistema incluye:

### ✅ Características Principales

1. **Código de Confirmación Único**: Cada registro confirmado recibe un código de 8 caracteres alfanuméricos
2. **Email Automático**: Se envía automáticamente cuando el pago es exitoso
3. **Plantilla Profesional**: Email HTML con diseño atractivo y toda la información del evento
4. **Datos Completos**: Incluye detalles del evento, pago y código de confirmación

### 🗂️ Archivos Creados/Modificados

#### Base de Datos
- `database/migrations/33_add_confirmation_code_to_event_registrations.sql`
- `database/APLICAR_CONFIRMATION_CODE_EVENTOS.sql` (para aplicar manualmente)

#### Backend
- `src/lib/email-sender.ts` - Funciones para enviar emails
- `src/app/api/stripe/webhook/route.ts` - Integración con webhook de Stripe
- `src/types/event-registration.ts` - Tipos actualizados

#### Plantilla de Email
- `database/email-templates/event-payment-confirmation.html` - Plantilla HTML profesional

## 🚀 Pasos para Activar el Sistema

### 1. Aplicar Migración de Base de Datos

Ejecutar en el SQL Editor de Supabase:

```sql
-- Copiar y pegar el contenido de:
-- database/APLICAR_CONFIRMATION_CODE_EVENTOS.sql
```

### 2. Configurar Servicio de Email

El sistema actual usa una función placeholder. Para producción, integrar con:

#### Opción A: Resend (Recomendado para Next.js)
```bash
npm install resend
```

```typescript
// En src/lib/email-sender.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEventConfirmationEmail(data: EventConfirmationEmailData) {
  const { data: email, error } = await resend.emails.send({
    from: 'Holistia <noreply@holistia.io>',
    to: [data.user_email],
    subject: `✅ Confirmación de Pago - ${data.event_name} | Holistia`,
    html: emailContent,
  });
  
  return { success: !error, error: error?.message };
}
```

#### Opción B: SendGrid
```bash
npm install @sendgrid/mail
```

#### Opción C: Supabase Edge Function
Crear una Edge Function en Supabase para manejar el envío de emails.

### 3. Variables de Entorno

Agregar a `.env.local`:

```env
# Para Resend
RESEND_API_KEY=re_xxxxxxxxxx

# Para SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxx

# Para otros servicios
EMAIL_SERVICE_API_KEY=xxxxxxxxxx
```

## 📋 Contenido del Email

El email incluye:

### 🎯 Información del Usuario
- Nombre del usuario
- Código de confirmación único (8 caracteres)

### 📅 Detalles del Evento
- Nombre del evento
- Fecha y hora
- Ubicación
- Duración
- Categoría

### 💳 Información del Pago
- Monto pagado
- Fecha de pago
- Método de pago
- ID de transacción

### 📝 Instrucciones
- Guardar el código de confirmación
- Llegar 15 minutos antes
- Traer identificación
- Contacto de emergencia

## 🔧 Funcionamiento Técnico

### Flujo de Pago Exitoso

1. **Usuario completa pago** en Stripe
2. **Webhook de Stripe** recibe notificación
3. **Actualiza registro** a status 'confirmed'
4. **Trigger automático** genera código de confirmación
5. **Función de email** se ejecuta automáticamente
6. **Email se envía** con toda la información

### Código de Confirmación

- **Formato**: 8 caracteres alfanuméricos (ej: `A7B9C2D4`)
- **Generación**: Automática cuando status cambia a 'confirmed'
- **Unicidad**: Garantizada por constraint de base de datos
- **Uso**: Para verificar asistencia al evento

## 🎨 Personalización

### Modificar Plantilla de Email

Editar `database/email-templates/event-payment-confirmation.html`:

- Cambiar colores y estilos
- Agregar/remover información
- Modificar diseño
- Actualizar branding

### Personalizar Contenido

En `src/app/api/stripe/webhook/route.ts`, función `sendEventConfirmationEmail`:

- Modificar formato de fechas
- Cambiar etiquetas de categorías
- Agregar información adicional
- Personalizar mensajes

## 🧪 Testing

### Probar Generación de Código

```sql
-- En SQL Editor de Supabase
SELECT generate_event_confirmation_code() as test_code;
```

### Probar Email (Desarrollo)

El sistema actual loggea la información en consola. Para testing real:

1. Crear un evento de prueba
2. Registrar un usuario
3. Completar pago
4. Verificar logs en consola
5. Confirmar que se genera código

## 🚨 Consideraciones Importantes

### Seguridad
- Los códigos son únicos y no predecibles
- No se almacenan en logs
- Solo se envían por email

### Rendimiento
- Emails se envían de forma asíncrona
- No bloquean el webhook si fallan
- Logs de errores para debugging

### Escalabilidad
- Sistema preparado para múltiples eventos
- Códigos únicos globalmente
- Plantilla reutilizable

## 📞 Soporte

Si necesitas ayuda con la implementación:

1. Verificar logs de la consola
2. Revisar configuración de variables de entorno
3. Confirmar que la migración se aplicó correctamente
4. Probar con eventos de desarrollo

---

**¡El sistema está listo para usar! Solo necesitas aplicar la migración y configurar el servicio de email de tu preferencia.**
