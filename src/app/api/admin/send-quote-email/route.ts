import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface QuoteService {
  service_name: string;
  assigned_professionals: string[];
  professionals_names: string[];
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

interface QuoteEmailData {
  lead_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_size?: string;
  service_date?: string;
  service_time?: string;
  service_address?: string;
  services: QuoteService[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total: number;
  additional_notes: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: QuoteEmailData = await request.json();

    const {
      lead_id,
      company_name,
      contact_name,
      contact_email,
      services,
      subtotal,
      discount_percentage,
      discount_amount,
      total,
      additional_notes
    } = data;

    // Validar datos requeridos
    if (!contact_email || !company_name || !services || services.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Generar las filas de servicios para la tabla HTML
    const servicesRows = services.map((service) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <strong>${service.service_name}</strong>
          ${service.notes ? `<br><span style="font-size: 12px; color: #718096;">${service.notes}</span>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">
          ${service.professionals_names.length > 0 ? service.professionals_names.join(', ') : 'Por asignar'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${service.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          $${service.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
          $${service.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `).join('');

    // Crear el contenido del email
    const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotización de Servicios Corporativos - Holistia</title>
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
        .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
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
        .intro {
            font-size: 16px;
            line-height: 1.8;
            color: #4a5568;
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .services-table th {
            background-color: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        .services-table th:nth-child(3),
        .services-table th:nth-child(4),
        .services-table th:nth-child(5) {
            text-align: right;
        }
        .services-table td {
            color: #4a5568;
        }
        .summary-box {
            background-color: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
        }
        .summary-row.total {
            border-top: 2px solid #667eea;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 20px;
            font-weight: 700;
            color: #667eea;
        }
        .notes-box {
            background-color: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .notes-box h3 {
            margin: 0 0 10px 0;
            color: #2d3748;
            font-size: 16px;
        }
        .notes-content {
            color: #4a5568;
            font-size: 14px;
            line-height: 1.8;
        }
        .cta-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
        }
        .cta-box h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .cta-box p {
            margin: 0 0 15px 0;
            opacity: 0.95;
        }
        .button {
            display: inline-block;
            background-color: white;
            color: #667eea;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
            color: #718096;
            font-size: 14px;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #4a5568;
        }
        .signature p {
            margin: 5px 0;
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
            <h1>💼 COTIZACIÓN DE SERVICIOS</h1>
            <p>Holistia para Empresas</p>
        </div>

        <div class="content">
            <div class="greeting">
                Estimado/a ${contact_name},
            </div>

            <div class="intro">
                Nos complace presentarle la cotización de servicios holísticos corporativos para <strong>${company_name}</strong>.
                Nuestros programas están diseñados para mejorar el bienestar integral de sus colaboradores y crear un ambiente
                de trabajo más saludable y productivo.
            </div>

            <div class="section-title">📋 Servicios Cotizados</div>

            <table class="services-table">
                <thead>
                    <tr>
                        <th>Servicio</th>
                        <th>Profesional(es)</th>
                        <th style="text-align: center;">Sesiones</th>
                        <th style="text-align: right;">Precio/Sesión</th>
                        <th style="text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicesRows}
                </tbody>
            </table>

            <div class="summary-box">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>
                ${discount_percentage > 0 ? `
                <div class="summary-row">
                    <span>Descuento (${discount_percentage}%):</span>
                    <span style="color: #48bb78;">-$${discount_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>TOTAL:</span>
                    <span>$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>
            </div>

            ${additional_notes ? `
            <div class="notes-box">
                <h3>📝 Notas y Condiciones</h3>
                <div class="notes-content">
                    ${additional_notes}
                </div>
            </div>
            ` : ''}

            <div class="cta-box">
                <h3>¿Listo para comenzar?</h3>
                <p>Nuestro equipo está disponible para responder cualquier pregunta y ayudarle a implementar estos servicios en su empresa.</p>
                <a href="mailto:contacto@holistia.io?subject=Cotización%20${company_name}" class="button">
                    Contactar al Equipo
                </a>
            </div>

            <div class="signature">
                <p class="name">El equipo de Holistia</p>
                <p>Plataforma de Salud Integral y Bienestar Corporativo</p>
                <p>📧 contacto@holistia.io | 📱 +52 333 XXX XXXX | 🌐 www.holistia.io</p>
            </div>
        </div>

        <div class="footer">
            <p>
                Este email fue generado automáticamente desde la plataforma Holistia.
            </p>
            <p>
                Fecha de emisión: ${new Date().toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Generar PDF de la cotización
    let pdfAttachment = null;
    try {
      const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/companies/generate-quote-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          lead_id,
          company_name,
          contact_name,
          contact_email,
          contact_phone: data.contact_phone,
          company_size: data.company_size,
          service_date: data.service_date,
          service_time: data.service_time,
          service_address: data.service_address,
          services,
          subtotal,
          discount_percentage,
          discount_amount,
          total,
          additional_notes
        }),
      });

      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json();
        if (pdfData.success && pdfData.pdf) {
          pdfAttachment = {
            filename: pdfData.fileName || `Cotizacion_${company_name.replace(/\s/g, '_')}.pdf`,
            content: pdfData.pdf, // Resend acepta base64 string directamente
          };
        }
      }
    } catch (pdfError) {
      console.error('Error generating PDF for email:', pdfError);
      // Continuar sin PDF si falla
    }

    // Enviar email usando Resend
    const emailPayload: any = {
      from: 'Holistia Empresas <empresas@holistia.io>',
      to: [contact_email],
      subject: `Cotización de Servicios Holísticos - ${company_name} | Holistia`,
      html: emailContent,
    };

    // Agregar PDF como adjunto si se generó correctamente
    if (pdfAttachment) {
      emailPayload.attachments = [pdfAttachment];
    }

    const { data: emailData, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Error sending quote email:', error);
      return NextResponse.json(
        { success: false, error: 'Error al enviar el email' },
        { status: 500 }
      );
    }

    console.log('Quote email sent successfully:', emailData?.id);

    // Registrar el correo en la tabla email_logs
    try {
      const supabase = await createClient();

      // Insertar el log del email
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          recipient_email: contact_email,
          recipient_id: null,
          email_type: 'company_quote',
          subject: `Cotización de Servicios Holísticos - ${company_name} | Holistia`,
          status: 'sent',
          metadata: {
            lead_id: lead_id,
            company_name: company_name,
            contact_name: contact_name,
            total_amount: total,
            services_count: services.length,
            resend_id: emailData?.id
          }
        });

      if (logError) {
        console.error('Error logging email:', logError);
      } else {
        console.log('Email logged successfully');
      }
    } catch (logError) {
      console.error('Error in email logging process:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada exitosamente',
      emailId: emailData?.id
    });

  } catch (error) {
    console.error('Error in send-quote-email API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
