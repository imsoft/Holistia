import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEventFreeRegistrationConfirmation } from '@/lib/email-sender';
import { formatEventDate } from '@/utils/date-utils';

/** Genera código de confirmación único (8 caracteres alfanuméricos) */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { event_id } = body;

    if (!event_id || typeof event_id !== 'string') {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el evento existe, está activo y es gratuito
    const { data: event, error: eventError } = await supabase
      .from('events_workshops')
      .select('id, name, slug, event_date, event_time, end_time, location, duration_hours, category, is_free')
      .eq('id', event_id)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no disponible' },
        { status: 404 }
      );
    }

    if (!event.is_free) {
      return NextResponse.json(
        { error: 'Este evento requiere pago. Usa el botón de pago para registrarte.' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene registro confirmado
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing?.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este evento' },
        { status: 400 }
      );
    }

    const confirmationCode = generateConfirmationCode();

    if (existing) {
      // Actualizar registro existente (ej. pendiente) a confirmado
      const { data: updated, error: updateError } = await supabase
        .from('event_registrations')
        .update({
          status: 'confirmed',
          confirmation_code: confirmationCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('Error updating event registration:', updateError);
        return NextResponse.json(
          { error: 'Error al confirmar tu registro' },
          { status: 500 }
        );
      }
    } else {
      // Crear nuevo registro
      const { data: registration, error: insertError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: event_id,
          user_id: user.id,
          status: 'confirmed',
          confirmation_code: confirmationCode,
        })
        .select()
        .single();

      if (insertError || !registration) {
        if (insertError?.code === '23505') {
          return NextResponse.json(
            { error: 'Ya tienes un registro para este evento' },
            { status: 400 }
          );
        }
        console.error('Error creating event registration:', insertError);
        return NextResponse.json(
          { error: 'Error al crear tu registro' },
          { status: 500 }
        );
      }
    }

    // Obtener perfil para el email
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, full_name, email')
      .eq('id', user.id)
      .single();

    const userEmail = user.email ?? profile?.email;
    const userName =
      profile?.full_name?.trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      'Participante';

    if (!userEmail) {
      console.warn('No email for user, skipping confirmation email');
    } else {
      const eventDateFormatted = formatEventDate(event.event_date);
      const eventTimeStr =
        event.event_time
          ? `${String(event.event_time).slice(0, 5)}${event.end_time ? ` - ${String(event.end_time).slice(0, 5)}` : ''}`
          : '';

      await sendEventFreeRegistrationConfirmation({
        user_name: userName,
        user_email: userEmail,
        confirmation_code: confirmationCode,
        event_name: event.name,
        event_date: eventDateFormatted,
        event_time: eventTimeStr,
        event_location: event.location || '',
        event_duration: event.duration_hours || 1,
        my_registrations_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io'}/my-registrations`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Registro confirmado. Revisa tu email con los detalles.',
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Error in free-register:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
