import { createClient } from '@/utils/supabase/server';

interface EventConfirmationEmailData {
  user_name: string;
  user_email: string;
  confirmation_code: string;
  event_name: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_duration: number;
  event_category: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  event_url: string;
}

interface AppointmentNotificationToProfessionalData {
  professional_name: string;
  professional_email: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes: number;
  cost: number;
  location: string;
  notes?: string;
  appointments_url: string;
}

interface AppointmentConfirmationToPatientData {
  patient_name: string;
  patient_email: string;
  professional_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes: number;
  cost: number;
  location: string;
  notes?: string;
}

export async function sendEventConfirmationEmail(data: EventConfirmationEmailData) {
  try {
    const supabase = await createClient();
    
    // Read the email template
    const templatePath = 'database/email-templates/event-payment-confirmation.html';
    const fs = await import('fs');
    const path = await import('path');
    
    let emailTemplate: string;
    try {
      emailTemplate = fs.readFileSync(path.join(process.cwd(), templatePath), 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }
    
    // Replace placeholders in the template
    const emailContent = emailTemplate
      .replace(/\{\{user_name\}\}/g, data.user_name)
      .replace(/\{\{confirmation_code\}\}/g, data.confirmation_code)
      .replace(/\{\{event_name\}\}/g, data.event_name)
      .replace(/\{\{event_date\}\}/g, data.event_date)
      .replace(/\{\{event_time\}\}/g, data.event_time)
      .replace(/\{\{event_location\}\}/g, data.event_location)
      .replace(/\{\{event_duration\}\}/g, data.event_duration.toString())
      .replace(/\{\{event_category\}\}/g, data.event_category)
      .replace(/\{\{payment_amount\}\}/g, data.payment_amount.toFixed(2))
      .replace(/\{\{payment_date\}\}/g, data.payment_date)
      .replace(/\{\{payment_method\}\}/g, data.payment_method)
      .replace(/\{\{transaction_id\}\}/g, data.transaction_id)
      .replace(/\{\{event_url\}\}/g, data.event_url);
    
    // Send email using Supabase Edge Function or external service
    // For now, we'll use a simple approach with Supabase's built-in email
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.user_email,
        subject: `✅ Confirmación de Pago - ${data.event_name} | Holistia`,
        html: emailContent,
        from: 'holistia.io@gmail.com'
      }
    });
    
    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Event confirmation email sent successfully to:', data.user_email);
    return { success: true };
    
  } catch (error) {
    console.error('Error in sendEventConfirmationEmail:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send appointment notification to professional when a patient books
export async function sendAppointmentNotificationToProfessional(data: AppointmentNotificationToProfessionalData) {
  try {
    const supabase = await createClient();

    // Read the email template
    const templatePath = 'database/email-templates/appointment-notification-to-professional.html';
    const fs = await import('fs');
    const path = await import('path');

    let emailTemplate: string;
    try {
      emailTemplate = fs.readFileSync(path.join(process.cwd(), templatePath), 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    // Replace placeholders in the template
    let emailContent = emailTemplate
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{patient_name\}\}/g, data.patient_name)
      .replace(/\{\{appointment_date\}\}/g, data.appointment_date)
      .replace(/\{\{appointment_time\}\}/g, data.appointment_time)
      .replace(/\{\{appointment_type\}\}/g, data.appointment_type)
      .replace(/\{\{duration_minutes\}\}/g, data.duration_minutes.toString())
      .replace(/\{\{cost\}\}/g, data.cost.toFixed(2))
      .replace(/\{\{location\}\}/g, data.location)
      .replace(/\{\{appointments_url\}\}/g, data.appointments_url);

    // Handle optional notes field
    if (data.notes) {
      emailContent = emailContent.replace(/\{\{#if notes\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
        return match
          .replace(/\{\{#if notes\}\}/g, '')
          .replace(/\{\{\/if\}\}/g, '')
          .replace(/\{\{notes\}\}/g, data.notes || '');
      });
    } else {
      emailContent = emailContent.replace(/\{\{#if notes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Send email using Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.professional_email,
        subject: `Nueva Cita Agendada - ${data.patient_name} | Holistia`,
        html: emailContent,
        from: 'holistia.io@gmail.com'
      }
    });

    if (error) {
      console.error('Error sending email to professional:', error);
      return { success: false, error: error.message };
    }

    console.log('Appointment notification sent successfully to professional:', data.professional_email);
    return { success: true };

  } catch (error) {
    console.error('Error in sendAppointmentNotificationToProfessional:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send confirmation to patient when professional confirms appointment
export async function sendAppointmentConfirmationToPatient(data: AppointmentConfirmationToPatientData) {
  try {
    const supabase = await createClient();

    // Read the email template
    const templatePath = 'database/email-templates/appointment-confirmation-to-patient.html';
    const fs = await import('fs');
    const path = await import('path');

    let emailTemplate: string;
    try {
      emailTemplate = fs.readFileSync(path.join(process.cwd(), templatePath), 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    // Replace placeholders in the template
    let emailContent = emailTemplate
      .replace(/\{\{patient_name\}\}/g, data.patient_name)
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{appointment_date\}\}/g, data.appointment_date)
      .replace(/\{\{appointment_time\}\}/g, data.appointment_time)
      .replace(/\{\{appointment_type\}\}/g, data.appointment_type)
      .replace(/\{\{duration_minutes\}\}/g, data.duration_minutes.toString())
      .replace(/\{\{cost\}\}/g, data.cost.toFixed(2))
      .replace(/\{\{location\}\}/g, data.location);

    // Handle optional notes field
    if (data.notes) {
      emailContent = emailContent.replace(/\{\{#if notes\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
        return match
          .replace(/\{\{#if notes\}\}/g, '')
          .replace(/\{\{\/if\}\}/g, '')
          .replace(/\{\{notes\}\}/g, data.notes || '');
      });
    } else {
      emailContent = emailContent.replace(/\{\{#if notes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Send email using Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.patient_email,
        subject: `Cita Confirmada con ${data.professional_name} | Holistia`,
        html: emailContent,
        from: 'holistia.io@gmail.com'
      }
    });

    if (error) {
      console.error('Error sending confirmation email to patient:', error);
      return { success: false, error: error.message };
    }

    console.log('Appointment confirmation sent successfully to patient:', data.patient_email);
    return { success: true };

  } catch (error) {
    console.error('Error in sendAppointmentConfirmationToPatient:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Alternative function using a simple email service (like Resend, SendGrid, etc.)
export async function sendEventConfirmationEmailSimple(data: EventConfirmationEmailData) {
  try {
    // This is a placeholder for a real email service integration
    // You can integrate with services like:
    // - Resend (recommended for Next.js)
    // - SendGrid
    // - Mailgun
    // - AWS SES

    console.log('Sending event confirmation email to:', data.user_email);
    console.log('Confirmation code:', data.confirmation_code);
    console.log('Event:', data.event_name);

    // For now, just log the email data
    // In production, replace this with actual email sending logic
    return { success: true, message: 'Email would be sent in production' };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
