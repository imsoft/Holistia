import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

const MOTIVATIONAL_MESSAGES = [
  'Cada paso cuenta. Hoy es un buen día para registrar tu avance y mantener el impulso.',
  'La constancia es la clave. Tu check-in de hoy te acerca un poco más a tu meta.',
  'No te rindas. Muchos abandonan justo antes de ver los resultados; tú puedes ser la excepción.',
  'Pequeños hábitos, grandes cambios. Dedica unos minutos a tu check-in y sigue construyendo.',
  'Tu yo del futuro te lo agradecerá. ¡Anímate y sube tu check-in del día!',
];

function getMotivationalMessage(dayNumber: number): string {
  const index = (dayNumber - 1) % MOTIVATIONAL_MESSAGES.length;
  return MOTIVATIONAL_MESSAGES[index];
}

function loadEmailTemplate(): string {
  const templatePath = path.join(process.cwd(), 'database', 'email-templates', 'challenge-checkin-reminder.html');
  return fs.readFileSync(templatePath, 'utf-8');
}

function replacePlaceholders(
  template: string,
  data: {
    participant_name: string;
    challenge_title: string;
    day_number: number;
    duration_days: number;
    my_challenges_url: string;
    motivational_message: string;
  }
): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return result;
}

/** Fecha "hoy" en UTC (YYYY-MM-DD) para comparar con started_at/created_at */
function getTodayUtcDateString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Diferencia en días entre dos fechas (solo fecha, sin hora). start y end en formato YYYY-MM-DD o Date. */
function daysBetween(start: Date, end: Date): number {
  const startOnly = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endOnly = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const diffMs = endOnly.getTime() - startOnly.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
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
    const todayDate = new Date(todayStr + 'T12:00:00Z');

    const { data: purchases, error: purchasesError } = await supabase
      .from('challenge_purchases')
      .select('id, participant_id, started_at, created_at, challenge_id, challenges(duration_days, title)')
      .eq('access_granted', true);

    if (purchasesError) {
      console.error('Error fetching challenge_purchases:', purchasesError);
      return NextResponse.json({ error: 'Database error', details: purchasesError.message }, { status: 500 });
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({
        message: 'No active challenge participations',
        sent: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const participantIds = [...new Set(purchases.map((p) => p.participant_id).filter(Boolean))] as string[];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, full_name')
      .in('id', participantIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Database error', details: profilesError.message }, { status: 500 });
    }

    const profileById = new Map((profiles || []).map((p) => [p.id, p]));

    const emailTemplate = loadEmailTemplate();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io';
    const myChallengesUrl = `${baseUrl}/my-challenges`;

    const results = { sent: 0, skipped: 0, failed: 0, details: [] as Array<{ email: string; status: string; reason?: string }> };

    for (const purchase of purchases) {
      const challenge = Array.isArray((purchase as any).challenges)
        ? (purchase as any).challenges[0]
        : (purchase as any).challenges;
      const durationDays = challenge?.duration_days;
      const challengeTitle = challenge?.title || 'Tu reto';

      if (!durationDays || durationDays < 1) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'no duration_days' });
        continue;
      }

      const startRef = purchase.started_at || purchase.created_at;
      if (!startRef) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'no start date' });
        continue;
      }

      const startDate = new Date(startRef);
      const dayNumber = daysBetween(startDate, todayDate) + 1;

      if (dayNumber < 1) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'challenge not started yet' });
        continue;
      }
      if (dayNumber > durationDays) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'challenge already ended' });
        continue;
      }

      const { data: existingCheckin } = await supabase
        .from('challenge_checkins')
        .select('id')
        .eq('challenge_purchase_id', purchase.id)
        .eq('day_number', dayNumber)
        .maybeSingle();

      if (existingCheckin) {
        results.skipped++;
        results.details.push({ email: '', status: 'skipped', reason: 'check-in already exists' });
        continue;
      }

      const profile = profileById.get(purchase.participant_id);
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

      const motivationalMessage = getMotivationalMessage(dayNumber);
      const html = replacePlaceholders(emailTemplate, {
        participant_name: participantName,
        challenge_title: challengeTitle,
        day_number: dayNumber,
        duration_days: durationDays,
        my_challenges_url: myChallengesUrl,
        motivational_message: motivationalMessage,
      });

      try {
        await resend.emails.send({
          from: 'Holistia <noreply@holistia.io>',
          to: email,
          subject: `🌟 Día ${dayNumber} de "${challengeTitle}" – ¡No olvides tu check-in!`,
          html,
        });

        results.sent++;
        results.details.push({ email, status: 'sent' });

        try {
          await supabase.from('email_logs').insert({
            recipient_email: email,
            recipient_id: purchase.participant_id,
            email_type: 'challenge_checkin_reminder',
            subject: `Día ${dayNumber} – Recordatorio check-in`,
            sent_at: new Date().toISOString(),
            status: 'sent',
            metadata: {
              challenge_purchase_id: purchase.id,
              challenge_id: purchase.challenge_id,
              day_number: dayNumber,
            },
          });
        } catch (logErr) {
          console.warn('Email log insert failed:', logErr);
        }
      } catch (emailErr) {
        console.error(`Failed to send reminder to ${email}:`, emailErr);
        results.failed++;
        results.details.push({ email, status: 'failed' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge check-in reminders processed',
      results: {
        sent: results.sent,
        skipped: results.skipped,
        failed: results.failed,
        details: results.details,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in challenge-checkin-reminders cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
