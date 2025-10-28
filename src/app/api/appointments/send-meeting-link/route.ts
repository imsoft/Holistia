import { NextRequest, NextResponse } from 'next/server';
import { sendMeetingLinkNotification } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      appointmentId,
      patientEmail,
      patientName,
      meetingLink,
      appointmentDate,
      appointmentTime,
    } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!appointmentId || !patientEmail || !patientName || !meetingLink || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Obtener nombre del profesional (puedes pasar esto desde el componente o buscarlo aquí)
    // Por ahora usaremos un valor genérico
    const professionalName = body.professionalName || 'Tu profesional';

    // Enviar el email
    const result = await sendMeetingLinkNotification({
      patient_name: patientName,
      patient_email: patientEmail,
      professional_name: professionalName,
      meeting_link: meetingLink,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error in send-meeting-link API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
