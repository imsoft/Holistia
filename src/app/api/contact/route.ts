import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, subject, message } = body;

    // Validación básica
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Por favor ingresa un email válido' },
        { status: 400 }
      );
    }

    // Verificar si Resend está configurado
    if (!resend) {
      console.error('RESEND_API_KEY no está configurado');
      return NextResponse.json(
        { error: 'Servicio de email no configurado. Por favor contacta al administrador.' },
        { status: 500 }
      );
    }

    // Enviar email usando Resend
    const { error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: ['hola@holistia.io'], // Cambia por tu email
      subject: `Nuevo mensaje de contacto: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Nuevo Mensaje de Contacto - Holistia
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Información del Contacto</h3>
            <p><strong>Nombre:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
            <p><strong>Asunto:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Mensaje</h3>
            <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
            <p>Este mensaje fue enviado desde el formulario de contacto de Holistia.</p>
            <p>Fecha: ${new Date().toLocaleString('es-MX', { 
              timeZone: 'America/Mexico_City',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      `,
      replyTo: email, // Para que puedas responder directamente al usuario
    });

    if (error) {
      console.error('Error enviando email:', error);
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Por favor intenta nuevamente.' },
        { status: 500 }
      );
    }

    // Enviar confirmación al usuario
    await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [email],
      subject: 'Confirmación de mensaje recibido - Holistia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ¡Mensaje Recibido!
          </h2>
          
          <p>Hola ${firstName},</p>
          
          <p>Gracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Resumen de tu mensaje:</h3>
            <p><strong>Asunto:</strong> ${subject}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX', { 
              timeZone: 'America/Mexico_City',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <p>Mientras tanto, puedes:</p>
          <ul>
            <li>Explorar nuestros <a href="https://holistia.io/blog" style="color: #007bff;">artículos del blog</a></li>
            <li>Seguirnos en nuestras redes sociales</li>
            <li>Conocer más sobre nuestros servicios</li>
          </ul>
          
          <p>¡Gracias por confiar en Holistia!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
            <p>Equipo Holistia<br>
            Plataforma de Salud Integral</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Mensaje enviado exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en el endpoint de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
