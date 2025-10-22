import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReminderType {
  type: '30_days' | '15_days' | '7_days' | 'expired';
  message: string;
  subject: string;
  color: string;
}

const REMINDER_TYPES: Record<string, ReminderType> = {
  '30_days': {
    type: '30_days',
    message: 'Te recordamos que tu inscripción anual en Holistia expirará en <strong>30 días</strong>. Para seguir apareciendo en nuestra plataforma y continuar recibiendo pacientes, es importante que realices tu renovación antes de la fecha de expiración.',
    subject: '🔔 Tu inscripción en Holistia expira en 30 días',
    color: '#f59e0b', // amarillo/naranja
  },
  '15_days': {
    type: '15_days',
    message: 'Tu inscripción anual en Holistia expirará en <strong>15 días</strong>. Te recomendamos renovar cuanto antes para evitar que tu perfil deje de aparecer en la plataforma.',
    subject: '⚠️ Tu inscripción en Holistia expira en 15 días',
    color: '#f97316', // naranja
  },
  '7_days': {
    type: '7_days',
    message: '⚠️ <strong>¡Atención!</strong> Tu inscripción anual en Holistia expirará en <strong>solo 7 días</strong>. Renueva hoy mismo para mantener tu visibilidad en la plataforma y no perder pacientes.',
    subject: '🚨 ¡Urgente! Tu inscripción en Holistia expira en 7 días',
    color: '#ef4444', // rojo
  },
  'expired': {
    type: 'expired',
    message: '❌ Tu inscripción anual en Holistia ha <strong>expirado</strong>. Tu perfil ya no aparece en la plataforma y los pacientes no pueden encontrarte. Renueva ahora para reactivar tu cuenta y volver a recibir reservas.',
    subject: '❌ Tu inscripción en Holistia ha expirado',
    color: '#dc2626', // rojo oscuro
  },
};

function getReminderType(daysUntilExpiration: number): ReminderType | null {
  if (daysUntilExpiration <= 0) {
    return REMINDER_TYPES.expired;
  } else if (daysUntilExpiration <= 7) {
    return REMINDER_TYPES['7_days'];
  } else if (daysUntilExpiration <= 15) {
    return REMINDER_TYPES['15_days'];
  } else if (daysUntilExpiration <= 30) {
    return REMINDER_TYPES['30_days'];
  }
  return null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function loadEmailTemplate(): string {
  const templatePath = path.join(process.cwd(), 'database', 'email-templates', 'registration-renewal-reminder.html');
  return fs.readFileSync(templatePath, 'utf-8');
}

function replaceTemplatePlaceholders(
  template: string,
  data: {
    professional_name: string;
    reminder_message: string;
    expiration_date: string;
    renewal_link: string;
    color: string;
  }
): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });
  return result;
}

export async function GET(request: Request) {
  try {
    // Verificar que la solicitud viene de Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Obtener profesionales que necesitan recordatorio
    // Incluye: los que expiran en 30 días o menos, O los que ya expiraron hace menos de 7 días
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: professionals, error } = await supabase
      .from('professional_applications')
      .select('id, user_id, first_name, last_name, email, registration_fee_expires_at')
      .eq('status', 'approved')
      .eq('registration_fee_paid', true)
      .or(`registration_fee_expires_at.lte.${thirtyDaysFromNow.toISOString()},registration_fee_expires_at.gte.${sevenDaysAgo.toISOString()}`);

    if (error) {
      console.error('Error fetching professionals:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!professionals || professionals.length === 0) {
      return NextResponse.json({ 
        message: 'No professionals need reminders at this time',
        sent: 0 
      });
    }

    const emailTemplate = loadEmailTemplate();
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ email: string; status: string; type?: string }>,
    };

    // Procesar cada profesional
    for (const prof of professionals) {
      if (!prof.registration_fee_expires_at) {
        results.skipped++;
        results.details.push({ email: prof.email, status: 'skipped - no expiration date' });
        continue;
      }

      const expirationDate = new Date(prof.registration_fee_expires_at);
      const diffTime = expirationDate.getTime() - now.getTime();
      const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const reminderType = getReminderType(daysUntilExpiration);

      if (!reminderType) {
        results.skipped++;
        results.details.push({ email: prof.email, status: 'skipped - no reminder needed' });
        continue;
      }

      // Verificar si ya se envió un recordatorio de este tipo recientemente (últimas 24 horas)
      const { data: recentReminder } = await supabase
        .from('email_logs')
        .select('id')
        .eq('recipient_email', prof.email)
        .eq('email_type', `registration_renewal_${reminderType.type}`)
        .gte('sent_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (recentReminder) {
        results.skipped++;
        results.details.push({ 
          email: prof.email, 
          status: 'skipped - already sent in last 24h',
          type: reminderType.type 
        });
        continue;
      }

      // Preparar datos del email
      const professionalName = `${prof.first_name} ${prof.last_name}`;
      const renewalLink = `${process.env.NEXT_PUBLIC_SITE_URL}/patient/${prof.user_id}/explore/become-professional`;

      const emailHtml = replaceTemplatePlaceholders(emailTemplate, {
        professional_name: professionalName,
        reminder_message: reminderType.message,
        expiration_date: formatDate(prof.registration_fee_expires_at),
        renewal_link: renewalLink,
        color: reminderType.color,
      });

      try {
        // Enviar email
        await resend.emails.send({
          from: 'Holistia <noreply@holistia.io>',
          to: prof.email,
          subject: reminderType.subject,
          html: emailHtml,
        });

        // Registrar en logs
        await supabase
          .from('email_logs')
          .insert({
            recipient_email: prof.email,
            recipient_id: prof.user_id,
            email_type: `registration_renewal_${reminderType.type}`,
            subject: reminderType.subject,
            sent_at: now.toISOString(),
            status: 'sent',
            metadata: {
              expiration_date: prof.registration_fee_expires_at,
              days_until_expiration: daysUntilExpiration,
              reminder_type: reminderType.type,
            },
          });

        results.sent++;
        results.details.push({ 
          email: prof.email, 
          status: 'sent',
          type: reminderType.type 
        });

        console.log(`✅ Sent ${reminderType.type} reminder to ${prof.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${prof.email}:`, emailError);
        results.failed++;
        results.details.push({ 
          email: prof.email, 
          status: 'failed',
          type: reminderType.type 
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder process completed`,
      results,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Error in registration reminders cron:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

