import { NextRequest, NextResponse } from 'next/server';
import { createClientForRequest } from '@/utils/supabase/api-auth';
import { createLoginLink } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRequest(request);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { professional_id } = body;

    if (!professional_id) {
      return NextResponse.json(
        { error: 'ID de profesional requerido' },
        { status: 400 }
      );
    }

    // Get professional by ID first
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('stripe_account_id, user_id')
      .eq('id', professional_id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Verify that the professional belongs to the authenticated user
    if (professional.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a este profesional' },
        { status: 403 }
      );
    }

    if (!professional.stripe_account_id) {
      return NextResponse.json(
        { error: 'No hay cuenta de Stripe conectada' },
        { status: 400 }
      );
    }

    // Create login link
    const dashboardUrl = await createLoginLink(professional.stripe_account_id);

    return NextResponse.json({
      url: dashboardUrl,
    });

  } catch (error) {
    console.error('Error creating dashboard link:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear enlace al dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

