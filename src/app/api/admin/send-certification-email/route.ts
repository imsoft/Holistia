import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface CertificationEmailData {
  professional_email: string;
  professional_name: string;
  profession: string;
  message: string;
  admin_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: CertificationEmailData = await request.json();
    
    const { professional_email, professional_name, profession, message, admin_name } = data;

    // Validar datos requeridos
    if (!professional_email || !professional_name || !message) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Crear el contenido del email
    const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Certificaciones - Holistia</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.8;
            color: #4a5568;
            margin-bottom: 30px;
            white-space: pre-line;
        }
        .info-box {
            background-color: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #2d3748;
            font-size: 16px;
        }
        .info-box p {
            margin: 0;
            color: #4a5568;
            font-size: 14px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #718096;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .signature p {
            margin: 5px 0;
            color: #4a5568;
        }
        .signature .name {
            font-weight: 600;
            color: #2d3748;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Certificaciones Recibidas</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hola ${professional_name},
            </div>
            
            <div class="message">
${message}
            </div>
            
            <div class="info-box">
                <h3>📋 Información de tu Perfil</h3>
                <p><strong>Profesión:</strong> ${profession}</p>
                <p><strong>Estado:</strong> Certificaciones verificadas ✅</p>
                <p><strong>Fecha de confirmación:</strong> ${new Date().toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.holistia.io" class="button">
                    Ver mi Perfil Profesional
                </a>
            </div>
            
            <div class="signature">
                <p class="name">El equipo de Holistia</p>
                <p>Plataforma de Salud Integral y Bienestar</p>
                <p>📧 soporte@holistia.io | 🌐 www.holistia.io</p>
            </div>
        </div>
        
        <div class="footer">
            <p>
                Este email fue enviado desde Holistia. Si tienes alguna pregunta, 
                no dudes en contactarnos.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Enviar email usando Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [professional_email],
      subject: `🎓 Certificaciones Recibidas - ${professional_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending certification email:', error);
      return NextResponse.json(
        { success: false, error: 'Error al enviar el email' },
        { status: 500 }
      );
    }

    console.log('Certification email sent successfully:', emailData?.id);
    
    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      emailId: emailData?.id
    });

  } catch (error) {
    console.error('Error in send-certification-email API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
