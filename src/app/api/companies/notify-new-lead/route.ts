import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lead_id,
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      service_date,
      service_time,
      service_address,
      requested_services,
    } = body;

    // Obtener información de los servicios solicitados
    const supabase = await createClient();
    const serviceIds = Array.isArray(requested_services) ? requested_services : [];
    
    let servicesInfo: Array<{ id: string; name: string }> = [];
    if (serviceIds.length > 0) {
      const { data: services } = await supabase
        .from('holistic_services')
        .select('id, name')
        .in('id', serviceIds);
      
      servicesInfo = services || [];
    }

    const servicesList = servicesInfo.map(s => s.name).join(', ') || 'No especificados';

    // Formatear fecha y hora
    const formattedDate = service_date 
      ? new Date(service_date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'No especificada';

    const formattedTime = service_time 
      ? new Date(`2000-01-01T${service_time}`).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No especificada';

    // Crear contenido del email
    const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Solicitud de Cotización - Holistia</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
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
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .alert-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-section {
            margin: 25px 0;
        }
        .info-section h3 {
            color: #2d3748;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-label {
            font-weight: 600;
            color: #4a5568;
            width: 180px;
            flex-shrink: 0;
        }
        .info-value {
            color: #2d3748;
            flex: 1;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Nueva Solicitud de Cotización</h1>
            <p>Empresa Corporativa</p>
        </div>

        <div class="content">
            <div class="alert-box">
                <strong>⚠️ Acción Requerida:</strong> Se ha recibido una nueva solicitud de cotización desde la página de empresas. 
                Por favor, revisa los detalles y genera una cotización desde el panel administrativo.
            </div>

            <div class="info-section">
                <h3>🏢 Información de la Empresa</h3>
                <div class="info-row">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value"><strong>${company_name}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Contacto:</span>
                    <span class="info-value">${contact_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${contact_email}</span>
                </div>
                ${contact_phone ? `
                <div class="info-row">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${contact_phone}</span>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>📅 Detalles del Servicio</h3>
                <div class="info-row">
                    <span class="info-label">Fecha Requerida:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Hora Requerida:</span>
                    <span class="info-value">${formattedTime}</span>
                </div>
                ${service_address ? `
                <div class="info-row">
                    <span class="info-label">Ubicación:</span>
                    <span class="info-value">${service_address}</span>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>🎯 Servicios Solicitados</h3>
                <div class="info-row">
                    <span class="info-label">Servicios:</span>
                    <span class="info-value">${servicesList}</span>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io'}/admin/companies" class="button">
                    Ver Solicitud en el Panel
                </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
                <p><strong>ID de Solicitud:</strong> ${lead_id}</p>
                <p><strong>Fecha de Recepción:</strong> ${new Date().toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })}</p>
            </div>
        </div>

        <div class="footer">
            <p>Este email fue generado automáticamente desde la plataforma Holistia.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Enviar email al equipo de Holistia
    const adminEmail = process.env.HOLISTIA_ADMIN_EMAIL || 'hola@holistia.io';
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holistia <noreply@holistia.io>',
      to: [adminEmail],
      subject: `📋 Nueva Solicitud de Cotización - ${company_name} | Holistia`,
      html: emailContent,
    });

    if (error) {
      console.error('Error sending notification email:', error);
      return NextResponse.json(
        { success: false, error: 'Error al enviar la notificación' },
        { status: 500 }
      );
    }

    console.log('Notification email sent successfully:', emailData?.id);

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada exitosamente',
      emailId: emailData?.id
    });

  } catch (error) {
    console.error('Error in notify-new-lead API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
