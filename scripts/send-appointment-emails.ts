/**
 * Script para enviar emails de citas existentes manualmente
 *
 * Uso:
 *   pnpm tsx scripts/send-appointment-emails.ts <appointment_id>
 *
 * Ejemplo:
 *   pnpm tsx scripts/send-appointment-emails.ts 863d9ef3-7a11-4151-95cb-215c61df025d
 */

import { createClient } from '@supabase/supabase-js';
import {
  sendAppointmentNotificationToProfessional,
  sendAppointmentPaymentConfirmation
} from '../src/lib/email-sender';

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase');
  console.error('   Asegúrate de que .env.local contenga:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function sendAppointmentEmails(appointmentId: string) {
  console.log('🔍 Buscando información de la cita...');
  console.log('Appointment ID:', appointmentId);
  console.log('');

  try {
    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('❌ Error: No se encontró la cita');
      console.error(appointmentError);
      return;
    }

    console.log('✅ Cita encontrada:');
    console.log('   Fecha:', appointment.appointment_date);
    console.log('   Hora:', appointment.appointment_time);
    console.log('   Estado:', appointment.status);
    console.log('   Costo:', `$${appointment.cost} MXN`);
    console.log('');

    // Get patient details
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', appointment.patient_id)
      .single();

    if (patientError || !patient) {
      console.error('❌ Error: No se encontró el paciente');
      return;
    }

    console.log('👤 Paciente:', `${patient.first_name} ${patient.last_name}`);
    console.log('   Email:', patient.email);
    console.log('');

    // Get professional details from professional_applications
    const { data: professionalApp, error: professionalAppError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('id', appointment.professional_id)
      .single();

    if (professionalAppError || !professionalApp) {
      console.error('❌ Error: No se encontró el profesional');
      return;
    }

    console.log('👨‍⚕️ Profesional:', `${professionalApp.first_name} ${professionalApp.last_name}`);
    console.log('   Email:', professionalApp.email);
    console.log('   Profesión:', professionalApp.profession);
    console.log('');

    // Check for payment
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (!payment) {
      console.log('⚠️  ADVERTENCIA: No se encontró un pago exitoso para esta cita');
      console.log('   Esto significa que el pago puede no haberse procesado.');
      console.log('');

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('¿Deseas continuar y enviar los emails de todas formas? (s/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 's') {
        console.log('❌ Cancelado por el usuario');
        return;
      }
    } else {
      console.log('💳 Pago encontrado:');
      console.log('   Monto:', `$${payment.amount} MXN`);
      console.log('   Fecha:', payment.paid_at);
      console.log('   Método:', payment.payment_method || 'Tarjeta');
      console.log('');
    }

    console.log('📧 Enviando emails...');
    console.log('');

    // Format appointment data
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const appointmentTime = appointment.appointment_time.substring(0, 5);

    const typeLabels = {
      presencial: "Presencial",
      online: "Online"
    };
    const appointmentType = typeLabels[appointment.appointment_type as keyof typeof typeLabels] || appointment.appointment_type;

    // 1. Send notification to professional
    console.log('1️⃣ Enviando notificación al profesional...');
    const professionalEmailData = {
      professional_name: `${professionalApp.first_name} ${professionalApp.last_name}`,
      professional_email: professionalApp.email,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: appointmentType,
      duration_minutes: appointment.duration_minutes || 50,
      cost: Number(appointment.cost),
      location: appointment.location || 'Por definir',
      notes: appointment.notes,
      appointments_url: `${process.env.NEXT_PUBLIC_SITE_URL}/professional/${appointment.professional_id}/appointments`
    };

    const professionalResult = await sendAppointmentNotificationToProfessional(professionalEmailData);

    if (professionalResult.success) {
      console.log('   ✅ Email enviado al profesional');
      console.log('   ID:', professionalResult.id);
    } else {
      console.log('   ❌ Error enviando email al profesional:', professionalResult.error);
    }
    console.log('');

    // 2. Send ticket to patient (only if payment exists)
    if (payment) {
      console.log('2️⃣ Enviando ticket al paciente...');

      const paymentDate = new Date(payment.paid_at!).toLocaleDateString('es-ES');

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.holistia.com';
      const ticketData = {
        patient_name: `${patient.first_name} ${patient.last_name}`,
        patient_email: patient.email,
        professional_name: `${professionalApp.first_name} ${professionalApp.last_name}`,
        professional_title: professionalApp.profession,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        duration_minutes: appointment.duration_minutes || 50,
        location: appointment.location || 'Por definir',
        payment_amount: Number(payment.amount),
        payment_date: paymentDate,
        payment_method: payment.payment_method || 'Tarjeta',
        transaction_id: payment.stripe_payment_intent_id || payment.id,
        ticket_number: appointment.id.substring(0, 8).toUpperCase(),
        appointment_url: `${baseUrl}/explore/appointments`,
        meeting_link: appointment.meeting_link ?? null,
      };

      const patientResult = await sendAppointmentPaymentConfirmation(ticketData);

      if (patientResult.success) {
        console.log('   ✅ Ticket enviado al paciente');
        console.log('   ID:', patientResult.id);
      } else {
        console.log('   ❌ Error enviando ticket al paciente:', patientResult.error);
      }
    } else {
      console.log('2️⃣ ⏭️  Saltando envío de ticket (no hay pago registrado)');
    }

    console.log('');
    console.log('✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('❌ Error: Falta el ID de la cita');
    console.log('');
    console.log('Uso: pnpm tsx scripts/send-appointment-emails.ts <appointment_id>');
    console.log('');
    console.log('Ejemplo:');
    console.log('  pnpm tsx scripts/send-appointment-emails.ts 863d9ef3-7a11-4151-95cb-215c61df025d');
    process.exit(1);
  }

  const appointmentId = args[0];

  console.log('🔒 ================================');
  console.log('   ENVÍO DE EMAILS DE CITA');
  console.log('================================');
  console.log('');

  await sendAppointmentEmails(appointmentId);
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
