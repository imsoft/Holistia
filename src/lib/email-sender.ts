import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// PASSWORD RESET EMAIL
// ============================================================================

interface PasswordResetEmailData {
  user_name: string;
  user_email: string;
  reset_url: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const templatePath = path.join(process.cwd(), 'database/email-templates/password-reset.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading password reset email template:', error);
      return { success: false, error: 'Template not found' };
    }

    const emailContent = emailTemplate
      .replace(/\{\{user_name\}\}/g, data.user_name)
      .replace(/\{\{reset_url\}\}/g, data.reset_url);

    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.user_email],
      subject: 'Restablecer tu contraseña | Holistia',
      html: emailContent,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log('Password reset email sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

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

interface DigitalProductConfirmationEmailData {
  user_name: string;
  user_email: string;
  product_title: string;
  product_description: string;
  professional_name: string;
  product_url: string;
  my_products_url: string;
  purchase_date: string;
  file_url?: string | null;
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

interface AppointmentCreatedByProfessionalData {
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
  payment_url: string;
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

// Send digital product purchase confirmation email
export async function sendDigitalProductConfirmationEmail(data: DigitalProductConfirmationEmailData) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/digital-product-confirmation.html');
    let emailTemplate: string;
    
    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }
    
    // Replace placeholders
    let emailContent = emailTemplate
      .replace(/\{\{user_name\}\}/g, data.user_name)
      .replace(/\{\{product_title\}\}/g, data.product_title)
      .replace(/\{\{product_description\}\}/g, data.product_description)
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{product_url\}\}/g, data.product_url)
      .replace(/\{\{my_products_url\}\}/g, data.my_products_url)
      .replace(/\{\{purchase_date\}\}/g, data.purchase_date);
    
    // Handle file_url - show button only if file_url exists
    if (data.file_url) {
      emailContent = emailContent.replace(/\{\{file_url\}\}/g, data.file_url);
      // Remove the conditional wrapper comments and show the download button section
      emailContent = emailContent.replace(/<!-- START_DOWNLOAD_BUTTON -->[\s\S]*?<!-- END_DOWNLOAD_BUTTON -->/g, (match) => {
        return match.replace(/<!-- START_DOWNLOAD_BUTTON -->/g, '').replace(/<!-- END_DOWNLOAD_BUTTON -->/g, '');
      });
    } else {
      // Remove the entire download button section if no file_url
      emailContent = emailContent.replace(/<!-- START_DOWNLOAD_BUTTON -->[\s\S]*?<!-- END_DOWNLOAD_BUTTON -->/g, '');
      emailContent = emailContent.replace(/\{\{file_url\}\}/g, '');
    }

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.user_email],
      subject: `🎁 ¡Tu programa "${data.product_title}" está disponible! | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending digital product confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log('Digital product confirmation email sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error sending digital product confirmation email:', error);
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

// Send email to patient when professional creates an appointment (with payment link)
export async function sendAppointmentCreatedByProfessional(data: AppointmentCreatedByProfessionalData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-created-by-professional.html');
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
      .replace(/\{\{location\}\}/g, data.location)
      .replace(/\{\{payment_url\}\}/g, data.payment_url);

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
      subject: `📅 Nueva Cita Creada por ${data.professional_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending appointment created email:', error);
      return { success: false, error: error.message };
    }

    console.log('Appointment created email sent successfully:', emailData?.id);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error('Error in sendAppointmentCreatedByProfessional:', error);
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

// ============================================================================
// PROFESSIONAL APPLICATION EMAILS
// ============================================================================

interface ProfessionalApprovalEmailData {
  professional_name: string;
  professional_email: string;
  profession: string;
  dashboard_url: string;
}

interface ProfessionalRejectionEmailData {
  professional_name: string;
  professional_email: string;
  profession: string;
  review_notes?: string;
}

interface MeetingLinkNotificationData {
  patient_name: string;
  patient_email: string;
  professional_name: string;
  meeting_link: string;
  appointment_date: string;
  appointment_time: string;
}

// Send approval email to professional
export async function sendProfessionalApprovalEmail(data: ProfessionalApprovalEmailData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/professional-approval.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    // Replace placeholders in the template
    const emailContent = emailTemplate
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{profession\}\}/g, data.profession)
      .replace(/\{\{dashboard_url\}\}/g, data.dashboard_url);

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.professional_email],
      subject: `✅ ¡Felicidades! Tu solicitud ha sido aprobada | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending professional approval email:', error);
      return { success: false, error: error.message };
    }

    console.log('Professional approval email sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendProfessionalApprovalEmail:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send rejection email to professional
export async function sendProfessionalRejectionEmail(data: ProfessionalRejectionEmailData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/professional-rejection.html');
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
      .replace(/\{\{profession\}\}/g, data.profession);

    // Handle optional review notes
    if (data.review_notes) {
      emailContent = emailContent.replace(/\{\{#if review_notes\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
        return match
          .replace(/\{\{#if review_notes\}\}/g, '')
          .replace(/\{\{\/if\}\}/g, '')
          .replace(/\{\{review_notes\}\}/g, data.review_notes || '');
      });
    } else {
      emailContent = emailContent.replace(/\{\{#if review_notes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.professional_email],
      subject: `Actualización de tu solicitud | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending professional rejection email:', error);
      return { success: false, error: error.message };
    }

    console.log('Professional rejection email sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendProfessionalRejectionEmail:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send meeting link notification to patient
export async function sendMeetingLinkNotification(data: MeetingLinkNotificationData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/meeting-link-notification.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    // Replace placeholders in the template
    const emailContent = emailTemplate
      .replace(/\{\{patient_name\}\}/g, data.patient_name)
      .replace(/\{\{professional_name\}\}/g, data.professional_name)
      .replace(/\{\{meeting_link\}\}/g, data.meeting_link)
      .replace(/\{\{appointment_date\}\}/g, data.appointment_date)
      .replace(/\{\{appointment_time\}\}/g, data.appointment_time);

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.patient_email],
      subject: `🎥 Enlace de Reunión Virtual - ${data.appointment_date} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending meeting link notification:', error);
      return { success: false, error: error.message };
    }

    console.log('Meeting link notification sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendMeetingLinkNotification:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// DIRECT MESSAGE NOTIFICATION EMAILS
// ============================================================================

interface NewMessageNotificationData {
  recipient_name: string;
  recipient_email: string;
  sender_name: string;
  sender_type: 'user' | 'professional';
  sender_avatar_url?: string | null;
  message_preview: string;
  message_time: string;
  messages_url: string;
  conversation_id?: string;
}

// ============================================================================
// CHALLENGE INVITATION EMAILS
// ============================================================================

interface ChallengeInvitationEmailData {
  recipient_name: string;
  recipient_email: string;
  inviter_name: string;
  challenge_title: string;
  challenge_url: string;
  action: 'invited' | 'added';
  /** Si el reto tiene precio, URL del checkout Stripe para pagar y participar */
  payment_url?: string;
  /** Precio formateado (ej. "$500.00 MXN") para mostrar en el email */
  challenge_price?: string;
}

interface ChallengeMessageNotificationData {
  recipient_name: string;
  recipient_email: string;
  sender_name: string;
  sender_type: 'user' | 'professional';
  sender_avatar_url?: string | null;
  challenge_title: string;
  message_preview: string;
  message_time: string;
  challenge_url: string;
}

export async function sendChallengeInvitationEmail(data: ChallengeInvitationEmailData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const templatePath = path.join(process.cwd(), 'database/email-templates/challenge-invitation.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    const logoUrl = 'https://www.holistia.io/logos/holistia-black.png';

    const actionTitle = data.action === 'added'
      ? 'Te agregaron a un reto'
      : 'Te invitaron a un reto';

    const actionVerb = data.action === 'added'
      ? 'agregado'
      : 'invitado';

    const hasPayment = Boolean(data.payment_url && data.challenge_price);
    const challengePriceLine = hasPayment
      ? `<p class="meta" style="margin-top:8px;font-weight:600;">Costo del reto: ${data.challenge_price}</p><p class="meta" style="margin-top:4px;font-size:13px;">Debes completar el pago para participar en el reto.</p>`
      : '';
    const ctaBlock = hasPayment
      ? `<a href="${data.payment_url}" class="cta-button" style="color:#ffffff !important;">Pagar y participar</a><p class="cta-note" style="margin-top:8px;">Completa el pago con tarjeta para unirte al reto. Si el botón no funciona, copia y pega este enlace en tu navegador:<br />${data.payment_url}</p><p class="cta-note" style="margin-top:12px;">También puedes ver el reto (sin acceso completo hasta pagar):<br /><a href="${data.challenge_url}" style="color:#8B5CF6;">${data.challenge_url}</a></p>`
      : `<a href="${data.challenge_url}" class="cta-button" style="color:#ffffff !important;">Ver mi reto</a><div class="cta-note">Si el botón no funciona, copia y pega este enlace en tu navegador:<br />${data.challenge_url}</div>`;

    const emailContent = emailTemplate
      .replace(/\{\{logo_url\}\}/g, logoUrl)
      .replace(/\{\{recipient_name\}\}/g, data.recipient_name)
      .replace(/\{\{inviter_name\}\}/g, data.inviter_name)
      .replace(/\{\{challenge_title\}\}/g, data.challenge_title)
      .replace(/\{\{challenge_url\}\}/g, data.challenge_url)
      .replace(/\{\{action_title\}\}/g, actionTitle)
      .replace(/\{\{action_verb\}\}/g, actionVerb)
      .replace(/\{\{challenge_price_line\}\}/g, challengePriceLine)
      .replace(/\{\{cta_block\}\}/g, ctaBlock);

    const subject = data.action === 'added'
      ? `🎯 Te agregaron al reto "${data.challenge_title}" | Holistia`
      : `🎯 Invitación al reto "${data.challenge_title}" | Holistia`;

    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.recipient_email],
      subject,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending challenge invitation email:', error);
      return { success: false, error: error.message };
    }

    console.log('Challenge invitation email sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };
  } catch (error) {
    console.error('Error in sendChallengeInvitationEmail:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send notification when a new message is received
// Send notification when a new message is sent in a challenge chat
export async function sendChallengeMessageNotification(data: ChallengeMessageNotificationData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/challenge-message-notification.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    // Get sender initials
    const senderInitials = data.sender_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    // Get sender type label
    const senderTypeLabel = data.sender_type === 'professional' 
      ? 'Profesional' 
      : 'Usuario';

    // Construir URL del logo de Holistia
    const logoUrl = 'https://www.holistia.io/logos/holistia-black.png';
    
    // Construir HTML del avatar del remitente (imagen si existe, sino iniciales)
    let senderAvatarHtml = '';
    if (data.sender_avatar_url) {
      senderAvatarHtml = `<img src="${data.sender_avatar_url}" alt="${data.sender_name}" />`;
    } else {
      senderAvatarHtml = senderInitials;
    }

    // Replace placeholders in the template
    const emailContent = emailTemplate
      .replace(/\{\{logo_url\}\}/g, logoUrl)
      .replace(/\{\{sender_name\}\}/g, data.sender_name)
      .replace(/\{\{sender_initials\}\}/g, senderInitials)
      .replace(/\{\{sender_type_label\}\}/g, senderTypeLabel)
      .replace(/\{\{sender_avatar_html\}\}/g, senderAvatarHtml)
      .replace(/\{\{challenge_title\}\}/g, data.challenge_title)
      .replace(/\{\{message_preview\}\}/g, data.message_preview)
      .replace(/\{\{message_time\}\}/g, data.message_time)
      .replace(/\{\{challenge_url\}\}/g, data.challenge_url);

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.recipient_email],
      subject: `💬 Nuevo mensaje en "${data.challenge_title}" | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending challenge message notification:', error);
      return { success: false, error: error.message };
    }

    console.log('Challenge message notification sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendChallengeMessageNotification:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendNewMessageNotification(data: NewMessageNotificationData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read the email template
    const templatePath = path.join(process.cwd(), 'database/email-templates/new-message-notification.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    // Get sender initials
    const senderInitials = data.sender_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    // Get sender type label
    const senderTypeLabel = data.sender_type === 'professional' 
      ? 'Profesional' 
      : 'Usuario';

    // Construir URL del logo de Holistia
    const logoUrl = 'https://www.holistia.io/logos/holistia-black.png';
    
    // Construir HTML del avatar del remitente (imagen si existe, sino iniciales)
    let senderAvatarHtml = '';
    if (data.sender_avatar_url) {
      senderAvatarHtml = `<img src="${data.sender_avatar_url}" alt="${data.sender_name}" />`;
    } else {
      senderAvatarHtml = senderInitials;
    }
    
    // Construir URL del mensaje con conversation_id si está disponible
    let messagesUrl = data.messages_url;
    if (data.conversation_id) {
      // Si tenemos conversation_id, agregarlo como parámetro para abrir el chat específico
      const url = new URL(data.messages_url);
      url.searchParams.set('conversation', data.conversation_id);
      messagesUrl = url.toString();
    }

    // Replace placeholders in the template
    const emailContent = emailTemplate
      .replace(/\{\{sender_name\}\}/g, data.sender_name)
      .replace(/\{\{sender_initials\}\}/g, senderInitials)
      .replace(/\{\{sender_type_label\}\}/g, senderTypeLabel)
      .replace(/\{\{sender_avatar_html\}\}/g, senderAvatarHtml)
      .replace(/\{\{message_preview\}\}/g, data.message_preview)
      .replace(/\{\{message_time\}\}/g, data.message_time)
      .replace(/\{\{messages_url\}\}/g, messagesUrl)
      .replace(/\{\{logo_url\}\}/g, logoUrl);

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [data.recipient_email],
      subject: `💬 Nuevo mensaje de ${data.sender_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending new message notification:', error);
      return { success: false, error: error.message };
    }

    console.log('New message notification sent successfully:', emailData?.id);
    return { success: true, message: 'Email sent successfully', id: emailData?.id };

  } catch (error) {
    console.error('Error in sendNewMessageNotification:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// APPOINTMENT CANCELLATION EMAILS
// ============================================================================

interface AppointmentCancelledByPatientData {
  professional_name: string;
  professional_email: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  cost: number;
  cancellation_reason?: string;
  dashboard_url: string;
}

interface AppointmentCancelledByProfessionalData {
  patient_name: string;
  patient_email: string;
  professional_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  cost: number;
  cancellation_reason?: string;
  professional_url: string;
}

interface AppointmentNoShowNotificationData {
  recipient_name: string;
  recipient_email: string;
  professional_name: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  cost: number;
  no_show_description?: string;
  is_patient_no_show: boolean;
  dashboard_url: string;
}

// Send notification when patient cancels appointment
export async function sendAppointmentCancelledByPatient(data: AppointmentCancelledByPatientData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-cancelled-by-patient.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    let emailContent = emailTemplate
      .replace(/{{professional_name}}/g, data.professional_name)
      .replace(/{{patient_name}}/g, data.patient_name)
      .replace(/{{appointment_date}}/g, data.appointment_date)
      .replace(/{{appointment_time}}/g, data.appointment_time)
      .replace(/{{appointment_type}}/g, data.appointment_type)
      .replace(/{{cost}}/g, data.cost.toString())
      .replace(/{{dashboard_url}}/g, data.dashboard_url);

    // Handle optional cancellation reason
    if (data.cancellation_reason) {
      emailContent = emailContent
        .replace(/{{#if cancellation_reason}}/g, '')
        .replace(/{{\/if}}/g, '')
        .replace(/{{cancellation_reason}}/g, data.cancellation_reason);
    } else {
      emailContent = emailContent.replace(/{{#if cancellation_reason}}[\s\S]*?{{\/if}}/g, '');
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: data.professional_email,
      subject: `Cita cancelada - ${data.patient_name}`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending cancellation email to professional:', error);
      return { success: false, error };
    }

    console.log('Cancellation email sent to professional:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error in sendAppointmentCancelledByPatient:', error);
    return { success: false, error };
  }
}

// Send notification when professional cancels appointment
export async function sendAppointmentCancelledByProfessional(data: AppointmentCancelledByProfessionalData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-cancelled-by-professional.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    let emailContent = emailTemplate
      .replace(/{{patient_name}}/g, data.patient_name)
      .replace(/{{professional_name}}/g, data.professional_name)
      .replace(/{{appointment_date}}/g, data.appointment_date)
      .replace(/{{appointment_time}}/g, data.appointment_time)
      .replace(/{{appointment_type}}/g, data.appointment_type)
      .replace(/{{cost}}/g, data.cost.toString())
      .replace(/{{professional_url}}/g, data.professional_url);

    // Handle optional cancellation reason
    if (data.cancellation_reason) {
      emailContent = emailContent
        .replace(/{{#if cancellation_reason}}/g, '')
        .replace(/{{\/if}}/g, '')
        .replace(/{{cancellation_reason}}/g, data.cancellation_reason);
    } else {
      emailContent = emailContent.replace(/{{#if cancellation_reason}}[\s\S]*?{{\/if}}/g, '');
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: data.patient_email,
      subject: `Tu cita con ${data.professional_name} ha sido cancelada`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending cancellation email to patient:', error);
      return { success: false, error };
    }

    console.log('Cancellation email sent to patient:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error in sendAppointmentCancelledByProfessional:', error);
    return { success: false, error };
  }
}

// Send notification when someone doesn't show up
export async function sendAppointmentNoShowNotification(data: AppointmentNoShowNotificationData) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const templatePath = path.join(process.cwd(), 'database/email-templates/appointment-no-show-notification.html');
    let emailTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading email template:', error);
      return { success: false, error: 'Template not found' };
    }

    let emailContent = emailTemplate
      .replace(/{{recipient_name}}/g, data.recipient_name)
      .replace(/{{professional_name}}/g, data.professional_name)
      .replace(/{{patient_name}}/g, data.patient_name)
      .replace(/{{appointment_date}}/g, data.appointment_date)
      .replace(/{{appointment_time}}/g, data.appointment_time)
      .replace(/{{appointment_type}}/g, data.appointment_type)
      .replace(/{{cost}}/g, data.cost.toString())
      .replace(/{{dashboard_url}}/g, data.dashboard_url);

    // Handle conditional sections for patient vs professional no-show
    if (data.is_patient_no_show) {
      emailContent = emailContent
        .replace(/{{#if is_patient_no_show}}/g, '')
        .replace(/{{#if is_patient_no_show}}[\s\S]*?{{else}}[\s\S]*?{{\/if}}/g,
          emailContent.match(/{{#if is_patient_no_show}}([\s\S]*?){{else}}/)?.[1] || '');
    } else {
      emailContent = emailContent
        .replace(/{{#if is_patient_no_show}}[\s\S]*?{{else}}/g, '')
        .replace(/{{\/if}}/g, '');
    }

    // Handle optional no-show description
    if (data.no_show_description) {
      emailContent = emailContent
        .replace(/{{#if no_show_description}}/g, '')
        .replace(/{{\/if}}/g, '')
        .replace(/{{no_show_description}}/g, data.no_show_description);
    } else {
      emailContent = emailContent.replace(/{{#if no_show_description}}[\s\S]*?{{\/if}}/g, '');
    }

    const subject = data.is_patient_no_show
      ? `Reporte de inasistencia - ${data.appointment_date}`
      : `Disculpa por la inasistencia del profesional`;

    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: data.recipient_email,
      subject: subject,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending no-show notification:', error);
      return { success: false, error };
    }

    console.log('No-show notification sent:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error in sendAppointmentNoShowNotification:', error);
    return { success: false, error };
  }
}
