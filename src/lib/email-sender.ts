import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

interface AppointmentPaymentConfirmationData {
  patient_name: string;
  patient_email: string;
  professional_name: string;
  professional_title: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes: number;
  location: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  ticket_number: string;
}

interface RegistrationPaymentConfirmationData {
  professional_name: string;
  professional_email: string;
  profession: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  expiration_date: string;
  dashboard_url: string;
}

// ⚠️ DEPRECATED: Usar sendEventConfirmationEmailSimple en su lugar
// Esta función usa supabase.functions.invoke que no está implementado
// export async function sendEventConfirmationEmail(data: EventConfirmationEmailData) { ... }

// Send appointment notification to professional when a patient books
export async function sendAppointmentNotificationToProfessional(data: AppointmentNotificationToProfessionalData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-notification-to-professional.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
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

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.professional_email],
      subject: `📅 Nueva Cita Agendada - ${data.patient_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending email to professional:', error);
      return { success: false, error: error.message };
    }

    console.log('Appointment notification sent successfully to professional:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendAppointmentNotificationToProfessional:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send confirmation to patient when professional confirms appointment
export async function sendAppointmentConfirmationToPatient(data: AppointmentConfirmationToPatientData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-confirmation-to-patient.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
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

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.patient_email],
      subject: `✅ Cita Confirmada con ${data.professional_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending confirmation email to patient:', error);
      return { success: false, error: error.message };
    }

    console.log('Appointment confirmation sent successfully to patient:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendAppointmentConfirmationToPatient:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send event payment confirmation with Resend
export async function sendEventConfirmationEmailSimple(data: EventConfirmationEmailData) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/event-payment-confirmation.html');
    let emailTemplate: string;
    
    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }
    
    // Replace placeholders
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

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.user_email],
      subject: `🎟️ Tu Ticket para ${data.event_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending event confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log('Event confirmation email sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error sending event confirmation email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send appointment payment confirmation (ticket)
export async function sendAppointmentPaymentConfirmation(data: AppointmentPaymentConfirmationData) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-payment-confirmation.html');
    let emailTemplate: string;
    
    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }
    
    // Replace placeholders
    const emailContent = emailTemplate
      .replace(/\{\{patient_name\}\}/g, data.patient_name)
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{professional_title\}\}/g, data.professional_title)
      .replace(/\{\{appointment_date\}\}/g, data.appointment_date)
      .replace(/\{\{appointment_time\}\}/g, data.appointment_time)
      .replace(/\{\{appointment_type\}\}/g, data.appointment_type)
      .replace(/\{\{duration_minutes\}\}/g, data.duration_minutes.toString())
      .replace(/\{\{location\}\}/g, data.location)
      .replace(/\{\{payment_amount\}\}/g, data.payment_amount.toFixed(2))
      .replace(/\{\{payment_date\}\}/g, data.payment_date)
      .replace(/\{\{payment_method\}\}/g, data.payment_method)
      .replace(/\{\{transaction_id\}\}/g, data.transaction_id)
      .replace(/\{\{ticket_number\}\}/g, data.ticket_number);

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.patient_email],
      subject: `🎟️ Tu Ticket de Cita con ${data.professional_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending appointment payment confirmation:', error);
      return { success: false, error: error.message };
    }

    console.log('Appointment payment confirmation sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error sending appointment payment confirmation:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send registration payment confirmation (receipt)
export async function sendRegistrationPaymentConfirmation(data: RegistrationPaymentConfirmationData) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/registration-payment-confirmation.html');
    let emailTemplate: string;
    
    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }
    
    // Replace placeholders
    const emailContent = emailTemplate
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{professional_email\}\}/g, data.professional_email)
      .replace(/\{\{profession\}\}/g, data.profession)
      .replace(/\{\{payment_amount\}\}/g, data.payment_amount.toFixed(2))
      .replace(/\{\{payment_date\}\}/g, data.payment_date)
      .replace(/\{\{payment_method\}\}/g, data.payment_method)
      .replace(/\{\{transaction_id\}\}/g, data.transaction_id)
      .replace(/\{\{expiration_date\}\}/g, data.expiration_date)
      .replace(/\{\{dashboard_url\}\}/g, data.dashboard_url);

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.professional_email],
      subject: `🎉 Inscripción Confirmada - Bienvenido a Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending registration payment confirmation:', error);
      return { success: false, error: error.message };
    }

    console.log('Registration payment confirmation sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error sending registration payment confirmation:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
