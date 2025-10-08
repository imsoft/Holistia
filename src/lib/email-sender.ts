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
