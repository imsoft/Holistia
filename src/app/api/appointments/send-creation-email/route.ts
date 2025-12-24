import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendAppointmentCreatedByProfessional } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appointmentId, paymentUrl } = body;

    if (!appointmentId || !paymentUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: appointmentId y paymentUrl' },
        { status: 400 }
      );
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        professional_applications!appointments_professional_id_fkey (
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Get patient details
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', appointment.patient_id)
      .single();

    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError);
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appointmentTime = appointment.appointment_time;

    // Format appointment type
    const appointmentType = appointment.appointment_type === 'presencial' 
      ? 'Presencial' 
      : appointment.appointment_type === 'online' 
      ? 'En línea' 
      : appointment.appointment_type;

    // Get professional name
    const professional = appointment.professional_applications;
    const professionalName = professional 
      ? `${professional.first_name} ${professional.last_name}`
      : 'Profesional';

    // Send email
    const emailData = {
      patient_name: patient.full_name || 'Paciente',
      patient_email: patient.email || '',
      professional_name: professionalName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: appointmentType,
      duration_minutes: appointment.duration_minutes || 50,
      cost: appointment.cost,
      location: appointment.location || 'Por definir',
      notes: appointment.notes || undefined,
      payment_url: paymentUrl,
    };

    const emailResult = await sendAppointmentCreatedByProfessional(emailData);

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return NextResponse.json(
        { error: 'Error al enviar el email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      emailId: emailResult.emailId,
    });

  } catch (error) {
    console.error('Error in send-creation-email endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
