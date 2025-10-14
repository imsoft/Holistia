import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';

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
    const { professional_id, entity_type = 'professional' } = body;

    // Validate entity type
    if (!['professional', 'event'].includes(entity_type)) {
      return NextResponse.json(
        { error: 'Tipo de entidad inválido' },
        { status: 400 }
      );
    }

    // For professionals
    if (entity_type === 'professional') {
      if (!professional_id) {
        return NextResponse.json(
          { error: 'ID de profesional requerido' },
          { status: 400 }
        );
      }

      // Check if professional exists and belongs to user
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

      // Check if already has a Stripe account
      if (professional.stripe_account_id) {
        return NextResponse.json(
          { error: 'Ya tienes una cuenta de Stripe conectada' },
          { status: 400 }
        );
      }

      // Create Stripe Connect account
      const accountId = await createConnectAccount(professional.email, 'individual', 'MX');

      // Update professional with Stripe account ID
      const { error: updateError } = await supabase
        .from('professional_applications')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
        })
        .eq('id', professional_id);

      if (updateError) {
        console.error('Error updating professional:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar profesional' },
          { status: 500 }
        );
      }

      // Create account link for onboarding
      const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/professional/${user.id}/dashboard?stripe_onboarding=success`;
      const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/professional/${user.id}/dashboard?stripe_onboarding=refresh`;
      
      const accountLink = await createAccountLink(accountId, returnUrl, refreshUrl);

      return NextResponse.json({
        accountId,
        onboardingUrl: accountLink,
      });
    }

    // For events (if event organizer is different from professional)
    // This can be extended in the future if needed

    return NextResponse.json(
      { error: 'Tipo de entidad no soportado aún' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error creating Connect account:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear cuenta de Stripe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

