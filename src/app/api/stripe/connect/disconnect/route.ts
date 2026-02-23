import { NextRequest, NextResponse } from 'next/server';
import { createClientForRequest } from '@/utils/supabase/api-auth';

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
      .select('*')
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
        {
          success: false,
          message: 'No hay cuenta de Stripe conectada'
        },
        { status: 400 }
      );
    }

    // Disconnect Stripe account by clearing all Stripe-related fields
    const { error: updateError } = await supabase
      .from('professional_applications')
      .update({
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_charges_enabled: null,
        stripe_payouts_enabled: null,
        stripe_onboarding_completed: null,
        stripe_connected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', professional_id);

    if (updateError) {
      console.error('Error disconnecting Stripe account:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al desconectar cuenta de Stripe',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta de Stripe desconectada exitosamente',
    });

  } catch (error) {
    console.error('Error disconnecting Stripe account:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al desconectar cuenta de Stripe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
