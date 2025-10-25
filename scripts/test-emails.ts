/**
 * Script para probar el envío de emails
 * 
 * Uso:
 *   ts-node scripts/test-emails.ts [tipo] [email]
 * 
 * Ejemplos:
 *   ts-node scripts/test-emails.ts appointment test@example.com
 *   ts-node scripts/test-emails.ts event test@example.com
 *   ts-node scripts/test-emails.ts registration test@example.com
 */

import { 
  sendAppointmentPaymentConfirmation,
  sendEventConfirmationEmailSimple,
  sendRegistrationPaymentConfirmation
} from '../src/lib/email-sender';

const EMAIL_TYPES = ['appointment', 'event', 'registration', 'all'] as const;
type EmailType = typeof EMAIL_TYPES[number];

async function testAppointmentEmail(email: string) {
  console.log('📧 Testing Appointment Payment Confirmation...');
  
  const result = await sendAppointmentPaymentConfirmation({
    patient_name: "Juan Pérez (TEST)",
    patient_email: email,
    professional_name: "Dra. María González",
    professional_title: "Psicóloga Clínica",
    appointment_date: "lunes, 1 de enero de 2025",
    appointment_time: "10:00",
    appointment_type: "Online",
    duration_minutes: 50,
    location: "Consulta en línea",
    payment_amount: 1000,
    payment_date: "25 de octubre de 2024",
    payment_method: "Tarjeta",
    transaction_id: "TEST_pi_12345",
    ticket_number: "TEST1234",
  });

  if (result.success) {
    console.log('✅ Appointment email sent successfully!');
    console.log('   Email ID:', result.id);
  } else {
    console.error('❌ Failed to send appointment email:', result.error);
  }

  return result.success;
}

async function testEventEmail(email: string) {
  console.log('📧 Testing Event Payment Confirmation...');
  
  const result = await sendEventConfirmationEmailSimple({
    user_name: "Juan Pérez (TEST)",
    user_email: email,
    confirmation_code: "TEST-CONF-12345",
    event_name: "Taller de Meditación y Mindfulness",
    event_date: "sábado, 15 de diciembre de 2024",
    event_time: "10:00",
    event_location: "Centro Holistia, Av. Principal 123",
    event_duration: 3,
    event_category: "Espiritualidad",
    payment_amount: 500,
    payment_date: "25 de octubre de 2024",
    payment_method: "Tarjeta",
    transaction_id: "TEST_pi_67890",
    event_url: "https://holistia.io/patient/test/explore/event/test",
  });

  if (result.success) {
    console.log('✅ Event email sent successfully!');
    console.log('   Email ID:', result.id);
  } else {
    console.error('❌ Failed to send event email:', result.error);
  }

  return result.success;
}

async function testRegistrationEmail(email: string) {
  console.log('📧 Testing Registration Payment Confirmation...');
  
  const result = await sendRegistrationPaymentConfirmation({
    professional_name: "Dr. Carlos Ramírez (TEST)",
    professional_email: email,
    profession: "Psicólogo Clínico",
    payment_amount: 1000,
    payment_date: "25 de octubre de 2024",
    payment_method: "Tarjeta",
    transaction_id: "TEST_pi_11111",
    expiration_date: "25 de octubre de 2025",
    dashboard_url: "https://holistia.io/professional/test/dashboard",
  });

  if (result.success) {
    console.log('✅ Registration email sent successfully!');
    console.log('   Email ID:', result.id);
  } else {
    console.error('❌ Failed to send registration email:', result.error);
  }

  return result.success;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Error: Missing arguments');
    console.log('');
    console.log('Usage: ts-node scripts/test-emails.ts [type] [email]');
    console.log('');
    console.log('Types: appointment, event, registration, all');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node scripts/test-emails.ts appointment test@example.com');
    console.log('  ts-node scripts/test-emails.ts all test@example.com');
    process.exit(1);
  }

  const type = args[0] as EmailType;
  const email = args[1];

  if (!EMAIL_TYPES.includes(type)) {
    console.log(`❌ Error: Invalid type "${type}"`);
    console.log(`Valid types: ${EMAIL_TYPES.join(', ')}`);
    process.exit(1);
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('❌ Error: Invalid email format');
    process.exit(1);
  }

  console.log('🔒 ================================');
  console.log('   EMAIL TESTING - HOLISTIA');
  console.log('================================');
  console.log('');
  console.log(`Testing email(s): ${type}`);
  console.log(`Recipient: ${email}`);
  console.log('');

  const results: boolean[] = [];

  if (type === 'appointment' || type === 'all') {
    results.push(await testAppointmentEmail(email));
    console.log('');
  }

  if (type === 'event' || type === 'all') {
    results.push(await testEventEmail(email));
    console.log('');
  }

  if (type === 'registration' || type === 'all') {
    results.push(await testRegistrationEmail(email));
    console.log('');
  }

  // Summary
  console.log('================================');
  console.log('   SUMMARY');
  console.log('================================');
  
  const successful = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  console.log('');

  if (successful === total) {
    console.log('🎉 All emails sent successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Check your inbox at:', email);
    console.log('2. Verify email arrived and looks correct');
    console.log('3. Check Resend dashboard: https://resend.com/emails');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  Some emails failed to send');
    console.log('');
    console.log('📋 Troubleshooting:');
    console.log('1. Verify RESEND_API_KEY is set: echo $RESEND_API_KEY');
    console.log('2. Check Resend dashboard: https://resend.com/emails');
    console.log('3. Review docs/EMAIL_SYSTEM.md for more info');
    console.log('');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

