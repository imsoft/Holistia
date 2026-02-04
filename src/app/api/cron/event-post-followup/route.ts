import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEventPostFollowupEmail } from '@/lib/email-sender';
import { formatEventDate } from '@/utils/date-utils';

function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start) return '';
  const startStr = start.slice(0, 5);
  if (!end) return startStr;
  return `${startStr} - ${end.slice(0, 5)}`;
}

function subtractDays(date: Date, days: number): string {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - days);
  const y = copy.getUTCFullYear();
  const m = String(copy.getUTCMonth() + 1).padStart(2, '0');
  const d = String(copy.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

    const today = getTodayUtc();
    const yesterdayStr = subtractDays(today, 1);

    const { data: events, error: eventsError } = await supabase
      .from('events_workshops')
      .select('id, name, slug, event_date, event_time, end_time, is_active')
      .eq('event_date', yesterdayStr)
      .eq('is_active', true);

    if (eventsError) {
      console.error('Error fetching events for follow-up:', eventsError);
      return NextResponse.json(
        { error: 'Database error', details: eventsError.message },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: 'No events requiring follow-up today',
        sent: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const eventIds = events.map((e) => e.id).filter(Boolean);
    if (eventIds.length === 0) {
      return NextResponse.json({
        message: 'No events requiring follow-up today',
        sent: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select('id, event_id, user_id, status')
      .in('event_id', eventIds)
      .eq('status', 'confirmed');

    if (regError) {
      console.error('Error fetching registrations for follow-up:', regError);
      return NextResponse.json(
        { error: 'Database error', details: regError.message },
        { status: 500 }
      );
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        message: 'No confirmed registrations to follow-up',
        sent: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const registrationIds = registrations.map((r) => r.id);
    const userIds = [
      ...new Set(registrations.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
    ];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for follow-up:', profilesError);
      return NextResponse.json(
        { error: 'Database error', details: profilesError.message },
        { status: 500 }
      );
    }

    const profileById = new Map((profiles || []).map((p) => [p.id, p]));
    const eventById = new Map(events.map((e) => [e.id, e]));

    // Fetch email logs to avoid duplicates
    let alreadySent = new Set<string>();
    if (registrationIds.length > 0) {
      const { data: existingLogs } = await supabase
        .from('email_logs')
        .select('metadata')
        .eq('email_type', 'event_post_followup')
        .in('metadata->>event_registration_id', registrationIds);

      alreadySent = new Set(
        (existingLogs || [])
          .map((log) => log.metadata?.event_registration_id)
          .filter((id): id is string => Boolean(id))
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io';

    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ status: string; email?: string; reason?: string }>,
    };

    for (const registration of registrations) {
      if (alreadySent.has(registration.id)) {
        results.skipped++;
        results.details.push({ status: 'skipped', reason: 'email already sent' });
        continue;
      }

      const event = eventById.get(registration.event_id);
      if (!event) {
        results.skipped++;
        results.details.push({ status: 'skipped', reason: 'event not found' });
        continue;
      }

      const profile = profileById.get(registration.user_id);
      const email = profile?.email;
      if (!email) {
        results.skipped++;
        results.details.push({ status: 'skipped', reason: 'missing email' });
        continue;
      }

      const participantName =
        profile.full_name?.trim() ||
        [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
        'Participante';

      const feedbackUrl = `${baseUrl}/my-registrations?event=${encodeURIComponent(
        registration.event_id
      )}`;

      const eventDateFormatted = formatEventDate(event.event_date);
      const eventTimeFormatted = formatTimeRange(event.event_time, event.end_time);

      try {
        await sendEventPostFollowupEmail({
          participant_name: participantName,
          participant_email: email,
          event_name: event.name,
          event_date: eventDateFormatted,
          event_time: eventTimeFormatted,
          feedback_url: feedbackUrl,
        });

        results.sent++;
        results.details.push({ status: 'sent', email });

        try {
          await supabase.from('email_logs').insert({
            recipient_email: email,
            recipient_id: registration.user_id,
            email_type: 'event_post_followup',
            subject: `Seguimiento evento ${event.name}`,
            sent_at: new Date().toISOString(),
            status: 'sent',
            metadata: {
              event_registration_id: registration.id,
              event_id: registration.event_id,
              event_date: event.event_date,
            },
          });
        } catch (logError) {
          console.warn('Failed to insert email log for follow-up:', logError);
        }
      } catch (emailError) {
        console.error(`Failed to send follow-up email to ${email}:`, emailError);
        results.failed++;
        results.details.push({ status: 'failed', email });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event post follow-up emails processed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in event-post-followup cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
