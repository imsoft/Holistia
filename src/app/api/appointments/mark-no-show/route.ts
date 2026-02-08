import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sendAppointmentNoShowNotification } from '@/lib/email-sender';
import { wallClockToUtcMs } from '@/lib/availability';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      appointmentId,
      markedBy, // 'patient' or 'professional'
      noShowDescription
    } = body;

    if (!appointmentId || !markedBy) {
      return NextResponse.json(
        { error: 'appointmentId and markedBy are required' },
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
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Obtener información del profesional por separado
    const { data: professionalData, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id, user_id, first_name, last_name, email')
      .eq('id', appointment.professional_id)
      .single();

    if (professionalError || !professionalData) {
      console.error('Error fetching professional:', professionalError);
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    if (markedBy === 'patient' && appointment.patient_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para marcar esta cita' },
        { status: 403 }
      );
    }

    if (markedBy === 'professional' && professionalData?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para marcar esta cita' },
        { status: 403 }
      );
    }

    // Verificar que la cita esté en el pasado.
    // Las citas se almacenan como "wall clock" (hora local de plataforma, America/Mexico_City).
    // En el servidor (UTC) usamos wallClockToUtcMs para convertir correctamente.
    const appointmentMs = wallClockToUtcMs(
      String(appointment.appointment_date).split('T')[0],
      String(appointment.appointment_time).slice(0, 5)
    );
    const now = new Date();

    if (appointmentMs > now.getTime()) {
      return NextResponse.json(
        { error: 'Solo puedes marcar inasistencias para citas pasadas' },
        { status: 400 }
      );
    }

    // Determinar el nuevo estado basado en quién marca
    const newStatus = markedBy === 'professional' ? 'patient_no_show' : 'professional_no_show';

    // Actualizar la cita
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        no_show_marked_by: markedBy,
        no_show_description: noShowDescription || null,
        no_show_marked_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Error al marcar la inasistencia' },
        { status: 500 }
      );
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

    const professionalName = `${professionalData.first_name} ${professionalData.last_name}`;

    // Formatear fechas para el email — parseo manual para evitar UTC shift
    const [fmtY, fmtM, fmtD] = String(appointment.appointment_date).split('T')[0].split('-').map(Number);
    const appointmentDate = new Date(fmtY, fmtM - 1, fmtD).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appointmentTime = appointment.appointment_time.substring(0, 5);
    const appointmentType = appointment.appointment_type === 'presencial' ? 'Presencial' : 'En línea';

    // Si el profesional no se presentó, crear crédito adicional para el paciente
    if (markedBy === 'patient') {
      // Crear crédito de compensación
      await supabase
        .from('patient_credits')
        .insert({
          patient_id: appointment.patient_id,
          professional_id: appointment.professional_id,
          amount: appointment.cost,
          original_appointment_id: appointmentId,
          status: 'available',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    // Enviar email de notificación
    const recipientEmail = markedBy === 'professional'
      ? patientProfile?.email || ''
      : professionalData.email;

    const recipientName = markedBy === 'professional'
      ? patientName
      : professionalName;

    const dashboardUrl = markedBy === 'professional'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/patient/${appointment.patient_id}/explore/appointments`
      : `${process.env.NEXT_PUBLIC_APP_URL}/professional/${professionalData.user_id}/appointments`;

    await sendAppointmentNoShowNotification({
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      professional_name: professionalName,
      patient_name: patientName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: appointmentType,
      cost: appointment.cost,
      no_show_description: noShowDescription,
      is_patient_no_show: markedBy === 'professional',
      dashboard_url: dashboardUrl
    });

    return NextResponse.json({
      success: true,
      message: 'Inasistencia marcada exitosamente',
      ...(markedBy === 'patient' && {
        credit: {
          amount: appointment.cost,
          expires_in_days: 365
        }
      })
    });

  } catch (error) {
    console.error('Error in mark no-show:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
