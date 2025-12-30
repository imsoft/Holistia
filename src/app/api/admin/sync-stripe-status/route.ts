import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAccountStatus } from '@/lib/stripe';

export async function POST() {
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

    // Check if user is admin by verifying profile type
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.type !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Get all professionals with Stripe accounts
    const { data: professionals, error: professionalsError } = await supabase
      .from('professional_applications')
      .select('id, stripe_account_id')
      .not('stripe_account_id', 'is', null);

    if (professionalsError) {
      console.error('Error fetching professionals:', professionalsError);
      return NextResponse.json(
        { error: 'Error al obtener profesionales' },
        { status: 500 }
      );
    }

    if (!professionals || professionals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay profesionales con cuentas de Stripe para sincronizar',
        synced: 0,
        total: 0,
      });
    }

    let syncedCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    // Sync each professional's Stripe status
    for (const professional of professionals) {
      try {
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
        } else if (accountStatus.details_submitted) {
          updateData.stripe_account_status = 'pending';
        } else {
          updateData.stripe_account_status = 'not_connected';
        }

        const { error: updateError } = await supabase
          .from('professional_applications')
          .update(updateData)
          .eq('id', professional.id);

        if (updateError) {
          console.error(`Error updating professional ${professional.id}:`, updateError);
          errors.push({
            id: professional.id,
            error: updateError.message,
          });
        } else {
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing professional ${professional.id}:`, error);
        errors.push({
          id: professional.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${syncedCount} de ${professionals.length} profesionales actualizados`,
      synced: syncedCount,
      total: professionals.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error syncing Stripe status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al sincronizar estado de Stripe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
