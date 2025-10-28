import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import {
  sendAppointmentCancelledByPatient,
  sendAppointmentCancelledByProfessional
} from '@/lib/email-sender';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      appointmentId,
      cancelledBy, // 'patient' or 'professional'
      cancellationReason
    } = body;

    if (!appointmentId || !cancelledBy) {
      return NextResponse.json(
        { error: 'appointmentId and cancelledBy are required' },
        { status: 400 }
      );
    }

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, professional_applications!inner(user_id, first_name, last_name, email)')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga permiso para cancelar
    const professionalData = Array.isArray(appointment.professional_applications)
      ? appointment.professional_applications[0]
      : appointment.professional_applications;

    if (cancelledBy === 'patient' && appointment.patient_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para cancelar esta cita' },
        { status: 403 }
      );
    }

    if (cancelledBy === 'professional' && professionalData?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para cancelar esta cita' },
        { status: 403 }
      );
    }

    // Verificar que la cita no esté ya cancelada o completada
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Esta cita ya no puede ser cancelada' },
        { status: 400 }
      );
    }

    // Actualizar la cita a estado cancelado
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy,
        cancellation_reason: cancellationReason || null,
        cancelled_at: new Date().toISOString(),
        generates_credit: true,
        credit_amount: appointment.cost
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Error al cancelar la cita' },
        { status: 500 }
      );
    }

    // Crear el crédito para el paciente
    const { error: creditError } = await supabase
      .from('patient_credits')
      .insert({
        patient_id: appointment.patient_id,
        professional_id: appointment.professional_id,
        amount: appointment.cost,
        original_appointment_id: appointmentId,
        status: 'available',
        // Los créditos expiran en 1 año
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (creditError) {
      console.error('Error creating credit:', creditError);
      // No fallar la cancelación por esto, solo logear
    }

    // Obtener información del paciente
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', appointment.patient_id)
      .single();

    const patientName = patientProfile
      ? `${patientProfile.first_name} ${patientProfile.last_name}`
      : 'Paciente';

    // Formatear fechas para el email
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appointmentTime = appointment.appointment_time.substring(0, 5);
    const appointmentType = appointment.appointment_type === 'presencial' ? 'Presencial' : 'En línea';

    // Enviar email según quien canceló
    if (cancelledBy === 'patient') {
      // Email al profesional
      const professionalName = `${professionalData.first_name} ${professionalData.last_name}`;

      await sendAppointmentCancelledByPatient({
        professional_name: professionalName,
        professional_email: professionalData.email,
        patient_name: patientName,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        cost: appointment.cost,
        cancellation_reason: cancellationReason,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/professional/${professionalData.user_id}/appointments`
      });
    } else {
      // Email al paciente
      const professionalName = `${professionalData.first_name} ${professionalData.last_name}`;

      // Obtener el slug del profesional
      const { data: profApp } = await supabase
        .from('professional_applications')
        .select('id')
        .eq('user_id', professionalData.user_id)
        .eq('status', 'approved')
        .single();

      const professionalSlug = profApp?.id || '';

      await sendAppointmentCancelledByProfessional({
        patient_name: patientName,
        patient_email: patientProfile?.email || '',
        professional_name: professionalName,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        cost: appointment.cost,
        cancellation_reason: cancellationReason,
        professional_url: `${process.env.NEXT_PUBLIC_APP_URL}/patient/${appointment.patient_id}/explore/professional/${professionalSlug}`
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      credit: {
        amount: appointment.cost,
        expires_in_days: 365
      }
    });

  } catch (error) {
    console.error('Error in cancel appointment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
