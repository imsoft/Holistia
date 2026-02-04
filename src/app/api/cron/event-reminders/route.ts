import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

function loadEmailTemplate(): string {
  const templatePath = path.join(process.cwd(), 'database', 'email-templates', 'event-reminder.html');
  return fs.readFileSync(templatePath, 'utf-8');
}

function replacePlaceholders(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  });
  return result;
}

/** Fecha "hoy" en UTC (YYYY-MM-DD) */
function getTodayUtcDateString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Añadir días a una fecha YYYY-MM-DD */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Formatear fecha para mostrar (es-ES) */
function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Formatear hora HH:MM:SS -> HH:MM */
function formatEventTime(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.split(':').slice(0, 2).join(':');
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const todayStr = getTodayUtcDateString();
    const tomorrowStr = addDays(todayStr, 1);
    const dayAfterStr = addDays(todayStr, 2);

    // Obtener registros confirmados con datos del evento (event_date está en events_workshops)
    const { data: allRegistrations, error: allRegError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        event_id,
        user_id,
        confirmation_code,
        events_workshops (
          id,
          name,
          slug,
          event_date,
          event_time,
          end_time,
          location
        )
      `)
      .eq('status', 'confirmed');

    if (allRegError) {
      console.error('Error fetching event_registrations:', allRegError);
      return NextResponse.json(
        { error: 'Database error', details: allRegError.message },
        { status: 500 }
      );
    }

    const targetDates = [tomorrowStr, dayAfterStr];
    const filteredRegs = (allRegistrations || []).filter((r: any) => {
      const ev = Array.isArray(r.events_workshops) ? r.events_workshops[0] : r.events_workshops;
      return ev?.event_date && targetDates.includes(ev.event_date);
    });

    if (filteredRegs.length === 0) {
      return NextResponse.json({
        message: 'No event reminders to send',
        sent: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const userIds = [...new Set(filteredRegs.map((r: any) => r.user_id).filter(Boolean))] as string[];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Database error', details: profilesError.message },
        { status: 500 }
      );
    }

    const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Verificar qué registros ya recibieron recordatorio
    const { data: existingLogs } = await supabase
      .from('email_logs')
      .select('metadata')
      .eq('email_type', 'event_reminder');

    const alreadySent = new Set(
      (existingLogs || [])
        .filter((l: any) => l.metadata?.event_registration_id)
        .map((l: any) => l.metadata.event_registration_id as string)
    );

    const emailTemplate = loadEmailTemplate();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io';
    const myRegistrationsUrl = `${baseUrl}/my-registrations`;

    const results = { sent: 0, skipped: 0, failed: 0, details: [] as Array<{ email: string; status: string; reason?: string }> };

    for (const reg of filteredRegs) {
      if (alreadySent.has(reg.id)) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'reminder already sent' });
        continue;
      }

      const ev = Array.isArray((reg as any).events_workshops)
        ? (reg as any).events_workshops[0]
        : (reg as any).events_workshops;

      if (!ev?.name || !ev.event_date) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'missing event data' });
        continue;
      }

      const profile = profileById.get((reg as any).user_id);
      const email = profile?.email;
      if (!email || !email.trim()) {
        results.skipped++;
        results.details.push({ email: email || '', status: 'skipped', reason: 'no email' });
        continue;
      }

      const participantName =
        profile.full_name?.trim() ||
        [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
        'Participante';

      const confirmationCode = (reg as any).confirmation_code;
      const confirmationCodeLine = confirmationCode
        ? `<p style="color: #333333; font-size: 16px; margin: 0;"><strong>Código de confirmación:</strong> <span style="font-family: monospace; font-size: 18px; letter-spacing: 2px;">${confirmationCode}</span></p>`
        : '';

      const formattedDate = formatEventDate(ev.event_date);
      const formattedTime = formatEventTime(ev.event_time || '') + (ev.end_time ? ` - ${formatEventTime(ev.end_time)}` : '');

      const html = replacePlaceholders(emailTemplate, {
        participant_name: participantName,
        event_name: ev.name,
        event_date: formattedDate,
        event_time: formattedTime,
        event_location: ev.location || '',
        confirmation_code_line: confirmationCodeLine,
        my_registrations_url: myRegistrationsUrl,
      });

      try {
        await resend.emails.send({
          from: 'Holistia <noreply@holistia.io>',
          to: email,
          subject: `📅 Recordatorio: "${ev.name}" – ¡Tu evento es pronto!`,
          html,
        });

        results.sent++;
        results.details.push({ email, status: 'sent' });
        alreadySent.add(reg.id);

        try {
          await supabase.from('email_logs').insert({
            recipient_email: email,
            recipient_id: (reg as any).user_id,
            email_type: 'event_reminder',
            subject: `Recordatorio: ${ev.name}`,
            sent_at: new Date().toISOString(),
            status: 'sent',
            metadata: {
              event_registration_id: reg.id,
              event_id: ev.id,
              event_name: ev.name,
              event_date: ev.event_date,
            },
          });
        } catch (logErr) {
          console.warn('Email log insert failed:', logErr);
        }

        try {
          const timeLabel = formattedTime ? ` a las ${formattedTime}` : '';
          await supabase.from('notifications').insert({
            user_id: (reg as any).user_id,
            type: 'event_reminder',
            title: 'Recordatorio de evento',
            message: `\"${ev.name}\" es el ${formattedDate}${timeLabel}.`,
            action_url: `/my-registrations?event=${ev.id}`,
            metadata: {
              event_registration_id: reg.id,
              event_id: ev.id,
              event_name: ev.name,
              event_date: ev.event_date,
              event_time: ev.event_time,
              end_time: ev.end_time,
            },
          });
        } catch (notificationErr) {
          console.warn('Event reminder notification insert failed:', notificationErr);
        }
      } catch (emailErr) {
        console.error(`Failed to send event reminder to ${email}:`, emailErr);
        results.failed++;
        results.details.push({ email, status: 'failed' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event reminders processed',
      results: {
        sent: results.sent,
        skipped: results.skipped,
        failed: results.failed,
        details: results.details,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in event-reminders cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
