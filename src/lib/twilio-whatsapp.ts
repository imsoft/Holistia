import Twilio from 'twilio';

/**
 * Content SIDs de los templates de WhatsApp creados en Twilio Content Template Builder.
 * Los nombres deben coincidir con los usados en la consola de Twilio.
 */
const WHATSAPP_TEMPLATE_SIDS: Record<string, string> = {
  recordatorio_cita_holistia: 'HX2c696cfd7c2d5cbb78e01a004e246ac9',
  confirmacion_cita_holistia: 'HXb726705d699c5550af596f027159b2e7',
  recordatorio_evento_holistia: 'HX1f4b9d547f1d31195dec59f53fd1ddef',
  confirmacion_cita_botones_holistia: 'HX315757c77618d8866aa558131d3750d1',
} as const;

export type WhatsAppTemplateName = keyof typeof WHATSAPP_TEMPLATE_SIDS;

/**
 * Normaliza un número de teléfono al formato E.164 para WhatsApp (México).
 * Acepta números con o sin +52, con o sin 1 tras 52 (móvil).
 */
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  // México: 10 dígitos -> +52 + 10 dígitos; si ya tiene 12 y empieza en 52, ok
  if (digits.length === 10) return `+52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+52${digits.slice(1)}`;
  return digits.length >= 10 ? `+52${digits.slice(-10)}` : null;
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN deben estar definidos');
  }
  return Twilio(accountSid, authToken);
}

function getFromNumber(): string {
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!from) throw new Error('TWILIO_WHATSAPP_NUMBER debe estar definido (ej: whatsapp:+5213331811123)');
  return from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
}

export interface SendWhatsAppTemplateResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Envía un mensaje de WhatsApp usando un template aprobado.
 * Las variables del template se pasan como objeto con claves "1", "2", "3"... según {{1}}, {{2}}, etc.
 */
export async function sendWhatsAppTemplate(
  toPhone: string,
  templateName: WhatsAppTemplateName,
  contentVariables: Record<string, string>
): Promise<SendWhatsAppTemplateResult> {
  const to = normalizePhoneForWhatsApp(toPhone);
  if (!to) {
    return { success: false, error: 'Número de teléfono inválido o vacío' };
  }

  const contentSid = WHATSAPP_TEMPLATE_SIDS[templateName];
  if (!contentSid) {
    return { success: false, error: `Template desconocido: ${templateName}` };
  }

  try {
    const client = getTwilioClient();
    const from = getFromNumber();
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
      from,
      to: toWhatsApp,
      contentSid,
      contentVariables: JSON.stringify(contentVariables),
    });

    return { success: true, messageSid: message.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Twilio WhatsApp send error:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Helpers tipados por tipo de mensaje (usan las variables correctas)
// ---------------------------------------------------------------------------

/** Variables para recordatorio de cita: {{1}} nombre, {{2}} fecha, {{3}} hora, {{4}} profesional */
export async function sendAppointmentReminderWhatsApp(
  toPhone: string,
  params: { patientName: string; date: string; time: string; professionalName: string }
): Promise<SendWhatsAppTemplateResult> {
  return sendWhatsAppTemplate(toPhone, 'recordatorio_cita_holistia', {
    '1': params.patientName,
    '2': params.date,
    '3': params.time,
    '4': params.professionalName,
  });
}

/** Variables para confirmación de cita (solo texto): {{1}} nombre, {{2}} fecha, {{3}} hora, {{4}} profesional */
export async function sendAppointmentConfirmationWhatsApp(
  toPhone: string,
  params: { patientName: string; date: string; time: string; professionalName: string }
): Promise<SendWhatsAppTemplateResult> {
  return sendWhatsAppTemplate(toPhone, 'confirmacion_cita_holistia', {
    '1': params.patientName,
    '2': params.date,
    '3': params.time,
    '4': params.professionalName,
  });
}

/** Confirmación de cita con botones (Quick Reply). Mismas variables. */
export async function sendAppointmentConfirmationWithButtonsWhatsApp(
  toPhone: string,
  params: { patientName: string; date: string; time: string; professionalName: string }
): Promise<SendWhatsAppTemplateResult> {
  return sendWhatsAppTemplate(toPhone, 'confirmacion_cita_botones_holistia', {
    '1': params.patientName,
    '2': params.date,
    '3': params.time,
    '4': params.professionalName,
  });
}

/** Variables para recordatorio de evento: {{1}} nombre, {{2}} evento, {{3}} fecha, {{4}} hora, {{5}} lugar */
export async function sendEventReminderWhatsApp(
  toPhone: string,
  params: { participantName: string; eventName: string; date: string; time: string; location: string }
): Promise<SendWhatsAppTemplateResult> {
  return sendWhatsAppTemplate(toPhone, 'recordatorio_evento_holistia', {
    '1': params.participantName,
    '2': params.eventName,
    '3': params.date,
    '4': params.time,
    '5': params.location,
  });
}
