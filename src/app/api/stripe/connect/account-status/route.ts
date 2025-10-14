import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAccountStatus } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Get professional
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('id', professional_id)
      .eq('user_id', user.id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    if (!professional.stripe_account_id) {
      return NextResponse.json(
        { 
          connected: false,
          message: 'No hay cuenta de Stripe conectada'
        },
        { status: 200 }
      );
    }

    // Get account status from Stripe
    const accountStatus = await getAccountStatus(professional.stripe_account_id);

    // Update local database with current status
    const updateData: Record<string, unknown> = {
      stripe_charges_enabled: accountStatus.charges_enabled,
      stripe_payouts_enabled: accountStatus.payouts_enabled,
      stripe_onboarding_completed: accountStatus.details_submitted,
    };

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      updateData.stripe_account_status = 'connected';
      if (!professional.stripe_connected_at) {
        updateData.stripe_connected_at = new Date().toISOString();
      }
    } else if (accountStatus.details_submitted) {
      updateData.stripe_account_status = 'pending';
    }

    const { error: updateError } = await supabase
      .from('professional_applications')
      .update(updateData)
      .eq('id', professional_id);

    if (updateError) {
      console.error('Error updating professional status:', updateError);
    }

    return NextResponse.json({
      connected: true,
      accountId: accountStatus.id,
      charges_enabled: accountStatus.charges_enabled,
      payouts_enabled: accountStatus.payouts_enabled,
      details_submitted: accountStatus.details_submitted,
      requirements: accountStatus.requirements,
    });

  } catch (error) {
    console.error('Error getting account status:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener estado de cuenta',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

