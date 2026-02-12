import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface QuoteService {
  service_id: string;
  service_name: string;
  assigned_professionals: string[];
  professionals_names: string[];
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

interface GeneratePDFData {
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
  additional_notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y que sea admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.type !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data: GeneratePDFData = await request.json();
    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      company_size,
      service_date,
      service_time,
      service_address,
      services,
      subtotal,
      discount_percentage,
      discount_amount,
      total,
      additional_notes
    } = data;

    // Importar jsPDF dinámicamente
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Header - Logo y título
    doc.setFillColor(79, 70, 229); // primary color
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HOLISTIA', 20, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Cotización de Servicios Corporativos', 20, 30);

    // Información de la cotización
    let yPos = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos);

    // Información del cliente
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 20, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${company_name}`, 20, yPos);

    yPos += 6;
    doc.text(`Contacto: ${contact_name}`, 20, yPos);

    yPos += 6;
    doc.text(`Email: ${contact_email}`, 20, yPos);

    if (contact_phone) {
      yPos += 6;
      doc.text(`Teléfono: ${contact_phone}`, 20, yPos);
    }

    if (company_size) {
      yPos += 6;
      doc.text(`Tamaño: ${company_size}`, 20, yPos);
    }

    // Detalles del servicio si están disponibles
    if (service_date || service_time || service_address) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL SERVICIO', 20, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      if (service_date) {
        const [y, m, d] = String(service_date).split('T')[0].split('-').map(Number);
        const formattedDate = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        doc.text(`Fecha Requerida: ${formattedDate}`, 20, yPos);
        yPos += 6;
      }

      if (service_time) {
        const formattedTime = new Date(`2000-01-01T${service_time}`).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        });
        doc.text(`Hora Requerida: ${formattedTime}`, 20, yPos);
        yPos += 6;
      }

      if (service_address) {
        const addressLines = doc.splitTextToSize(`Ubicación: ${service_address}`, 170);
        doc.text(addressLines, 20, yPos);
        yPos += addressLines.length * 6;
      }
    }

    // Tabla de servicios
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIOS COTIZADOS', 20, yPos);

    yPos += 10;

    // Dibujar tabla manualmente
    const startX = 20;
    const cellHeight = 8;
    const colWidths = [60, 50, 25, 30, 25];

    // Encabezados de tabla
    doc.setFillColor(79, 70, 229);
    doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), cellHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    doc.text('Servicio', startX + 2, yPos + 5);
    doc.text('Profesional(es)', startX + colWidths[0] + 2, yPos + 5);
    doc.text('Sesiones', startX + colWidths[0] + colWidths[1] + 2, yPos + 5);
    doc.text('Precio/Sesión', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos + 5);
    doc.text('Subtotal', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos + 5);

    yPos += cellHeight;

    // Filas de datos
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    services.forEach((service, index) => {
      const professionals = service.professionals_names.length > 0
        ? service.professionals_names.join(', ')
        : 'Por asignar';

      // Fondo alternado
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), cellHeight, 'F');
      }

      // Bordes
      doc.setDrawColor(200, 200, 200);
      doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), cellHeight);

      // Contenido
      const serviceName = doc.splitTextToSize(service.service_name, colWidths[0] - 4);
      const profNames = doc.splitTextToSize(professionals, colWidths[1] - 4);

      doc.text(serviceName[0], startX + 2, yPos + 5);
      doc.text(profNames[0], startX + colWidths[0] + 2, yPos + 5);
      doc.text(service.quantity.toString(), startX + colWidths[0] + colWidths[1] + colWidths[2] / 2, yPos + 5, { align: 'center' });
      doc.text(`$${service.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2, yPos + 5, { align: 'right' });
      doc.text(`$${service.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, startX + colWidths.reduce((a, b) => a + b, 0) - 2, yPos + 5, { align: 'right' });

      yPos += cellHeight;
    });

    // Resumen de precios
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const xRight = 160;
    doc.text('Subtotal:', xRight, yPos);
    doc.text(`$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 190, yPos, { align: 'right' });

    if (discount_percentage > 0) {
      yPos += 6;
      doc.text(`Descuento (${discount_percentage}%):`, xRight, yPos);
      doc.text(`-$${discount_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 190, yPos, { align: 'right' });
    }

    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', xRight, yPos);
    doc.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 190, yPos, { align: 'right' });

    // Notas adicionales
    if (additional_notes) {
      yPos += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS Y CONDICIONES', 20, yPos);

      yPos += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Convertir HTML a texto plano (básico)
      const notesText = additional_notes.replace(/<[^>]*>/g, '');
      const splitNotes = doc.splitTextToSize(notesText, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Cotización generada por Holistia',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Generar PDF como base64 (sin prefijo data URI)
    const pdfOutput = doc.output('datauristring');
    const base64Data = pdfOutput.split(',')[1];

    return NextResponse.json({
      success: true,
      pdf: base64Data,
      fileName: `Cotizacion_${company_name.replace(/\s/g, '_')}_${Date.now()}.pdf`
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
