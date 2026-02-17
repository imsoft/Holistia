import { NextRequest, NextResponse } from 'next/server';
import Twilio from 'twilio';
import { createServiceRoleClient } from '@/utils/supabase/server';
import { normalizePhoneForWhatsApp } from '@/lib/twilio-whatsapp';
import { sendAppointmentCancelledByPatient } from '@/lib/email-sender';
import { formatDate } from '@/lib/date-utils';

/** Textos de botones del template confirmacion_cita_botones_holistia (y sus IDs si Twilio los envía) */
const CONFIRM_TEXTS = ['Confirmar', 'confirm'];
const CANCEL_TEXTS = ['No podré asistir', 'cancel'];
const RESCHEDULE_TEXTS = ['Reprogramar', 'reschedule'];

function getActionFromBody(body: string): 'confirm' | 'cancel' | 'reschedule' | null {
  const normalized = body?.trim() || '';
  if (CONFIRM_TEXTS.some((t) => t.toLowerCase() === normalized.toLowerCase())) return 'confirm';
  if (CANCEL_TEXTS.some((t) => t.toLowerCase() === normalized.toLowerCase())) return 'cancel';
  if (RESCHEDULE_TEXTS.some((t) => t.toLowerCase() === normalized.toLowerCase())) return 'reschedule';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = request.headers.get('x-twilio-signature') ?? request.headers.get('X-Twilio-Signature');
    const url = request.url;

    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value instanceof File ? '' : String(value);
    });

    const from = params.From ?? params.from ?? '';
    const body = params.Body ?? params.body ?? '';

    if (!from || !body) {
      return new NextResponse('Missing From or Body', { status: 400 });
    }

    if (authToken && signature) {
      const isValid = Twilio.validateRequest(authToken, signature, url, params);
      if (!isValid) {
        return new NextResponse('Unauthorized', { status: 403 });
      }
    }

    const action = getActionFromBody(body);
    if (!action) {
      return new NextResponse(null, { status: 200 });
    }

    const normalizedPhone = normalizePhoneForWhatsApp(from.replace(/^whatsapp:/i, ''));
    if (!normalizedPhone) {
      return new NextResponse(null, { status: 200 });
    }

    const supabase = createServiceRoleClient();
    const { data: profiles } = await supabase.from('profiles').select('id, phone').not('phone', 'is', null);
    const profile = (profiles || []).find((p) => normalizePhoneForWhatsApp(p.phone) === normalizedPhone);
    if (!profile) {
      return new NextResponse(null, { status: 200 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, patient_id, professional_id, status, appointment_date, appointment_time, cost, appointment_type, location')
      .eq('patient_id', profile.id)
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1);

    const appointment = appointments?.[0];
    if (!appointment) {
      return new NextResponse(null, { status: 200 });
    }

    if (action === 'confirm') {
      if (appointment.status !== 'confirmed') {
        await supabase
          .from('appointments')
          .update({ status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', appointment.id);
      }
      return new NextResponse(null, { status: 200 });
    }

    if (action === 'cancel' || action === 'reschedule') {
      const cancellationReason =
        action === 'cancel'
          ? 'No podrá asistir (confirmado por WhatsApp)'
          : 'Solicitud de reprogramar (WhatsApp)';

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_by: 'patient',
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString(),
          generates_credit: true,
          credit_amount: appointment.cost,
        })
        .eq('id', appointment.id);

      if (updateError) {
        console.error('WhatsApp webhook: error updating appointment', updateError);
        return new NextResponse(null, { status: 200 });
      }

      await supabase.from('patient_credits').insert({
        patient_id: appointment.patient_id,
        professional_id: appointment.professional_id,
        amount: appointment.cost,
        original_appointment_id: appointment.id,
        status: 'available',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const { data: professionalData } = await supabase
        .from('professional_applications')
        .select('user_id, first_name, last_name, email')
        .eq('id', appointment.professional_id)
        .single();

      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', profile.id)
        .single();

      const patientName = patientProfile
        ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim()
        : 'Paciente';
      const professionalName =
        professionalData?.first_name && professionalData?.last_name
          ? `${professionalData.first_name} ${professionalData.last_name}`
          : 'Profesional';

      if (professionalData?.email) {
        try {
          await sendAppointmentCancelledByPatient({
            professional_name: professionalName,
            professional_email: professionalData.email,
            patient_name: patientName,
            appointment_date: formatDate(appointment.appointment_date, 'es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            appointment_time: String(appointment.appointment_time).slice(0, 5),
            appointment_type: appointment.appointment_type === 'presencial' ? 'Presencial' : 'En línea',
            cost: appointment.cost,
            cancellation_reason: cancellationReason,
            dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''}/schedule`,
          });
        } catch (e) {
          console.warn('WhatsApp webhook: email to professional failed', e);
        }
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return new NextResponse(null, { status: 200 });
  }
}
