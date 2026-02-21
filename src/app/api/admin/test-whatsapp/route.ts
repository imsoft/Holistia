import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendWhatsAppTemplate, WhatsAppTemplateName } from '@/lib/twilio-whatsapp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.type !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores' }, { status: 403 });
    }

    const body = await request.json();
    const { phone, template, variables } = body as {
      phone: string;
      template: WhatsAppTemplateName;
      variables: Record<string, string>;
    };

    if (!phone || !template || !variables) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: phone, template, variables' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTemplate(phone, template, variables);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageSid: result.messageSid });
  } catch (error) {
    console.error('Error en test-whatsapp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
