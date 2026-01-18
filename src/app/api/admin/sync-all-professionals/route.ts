import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { getAccountStatus } from '@/lib/stripe';

interface SyncResult {
  professional_id: string;
  professional_name: string;
  professional_email: string;
  registration_payment_synced: boolean;
  stripe_connect_synced: boolean;
  payment_found_in_stripe: boolean;
  changes_made: string[];
  errors: string[];
}

/**
 * API endpoint unificado para sincronizar TODO de los profesionales:
 * 1. Pagos de inscripción pendientes (verifica en Stripe si ya pagaron)
 * 2. Estado de Stripe Connect (para recibir pagos de citas)
 * 3. Busca pagos de inscripción en Stripe incluso si no hay session_id
 *
 * Solo accesible para administradores
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profile?.type !== 'admin') {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    console.log('🔵 [Sync All] Iniciando sincronización completa de profesionales...');

    // Obtener TODOS los profesionales aprobados
    const { data: professionals, error: professionalsError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('status', 'approved');

    if (professionalsError) {
      console.error('❌ Error al obtener profesionales:', professionalsError);
      return NextResponse.json(
        { error: "Error al obtener profesionales" },
        { status: 500 }
      );
    }

    console.log(`📊 Encontrados ${professionals?.length || 0} profesionales aprobados`);

    const results: SyncResult[] = [];
    let totalPaymentsSynced = 0;
    let totalStripeConnectSynced = 0;
    let totalPaymentsFound = 0;

    for (const professional of professionals || []) {
      const result: SyncResult = {
        professional_id: professional.id,
        professional_name: `${professional.first_name} ${professional.last_name}`,
        professional_email: professional.email,
        registration_payment_synced: false,
        stripe_connect_synced: false,
        payment_found_in_stripe: false,
        changes_made: [],
        errors: [],
      };

      try {
        // ========================================
        // 1. SINCRONIZAR PAGO DE INSCRIPCIÓN
        // ========================================

        // Solo sincronizar si NO tiene el pago marcado como completado Y vigente
        const now = new Date();
        const isPaymentActive = professional.registration_fee_paid &&
          professional.registration_fee_expires_at &&
          new Date(professional.registration_fee_expires_at) > now;

        if (!isPaymentActive) {
          // Caso A: Tiene session_id - verificar directamente esa sesión
          if (professional.registration_fee_stripe_session_id) {
            try {
              const session = await stripe.checkout.sessions.retrieve(
                professional.registration_fee_stripe_session_id
              );

              if (session.payment_status === 'paid') {
                const expiresAt = new Date(now);
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);

                // Actualizar la aplicación profesional
                const { error: updateError } = await supabase
                  .from('professional_applications')
                  .update({
                    registration_fee_paid: true,
                    registration_fee_paid_at: now.toISOString(),
                    registration_fee_expires_at: expiresAt.toISOString(),
                  })
                  .eq('id', professional.id);

                if (!updateError) {
                  result.registration_payment_synced = true;
                  result.payment_found_in_stripe = true;
                  result.changes_made.push(`Pago de inscripción confirmado (session: ${session.id.substring(0, 20)}...)`);
                  totalPaymentsSynced++;
                  totalPaymentsFound++;

                  // También actualizar el registro de pago si existe
                  await supabase
                    .from('payments')
                    .update({
                      stripe_payment_intent_id: session.payment_intent as string,
                      status: 'succeeded',
                      paid_at: now.toISOString(),
                      payment_method: session.payment_method_types?.[0] || 'card',
                      transfer_status: 'completed',
                    })
                    .eq('professional_application_id', professional.id)
                    .eq('payment_type', 'registration');
                } else {
                  result.errors.push(`Error al actualizar: ${updateError.message}`);
                }
              }
            } catch (stripeError) {
              result.errors.push(`Error al verificar sesión: ${stripeError instanceof Error ? stripeError.message : 'Error desconocido'}`);
            }
          }

          // Caso B: NO tiene session_id - buscar en Stripe por email
          if (!result.payment_found_in_stripe && professional.email) {
            try {
              // Buscar clientes en Stripe por email
              const customers = await stripe.customers.list({
                email: professional.email,
                limit: 5,
              });

              for (const customer of customers.data) {
                // Buscar sesiones de checkout completadas para este cliente
                const sessions = await stripe.checkout.sessions.list({
                  customer: customer.id,
                  limit: 10,
                });

                for (const session of sessions.data) {
                  // Verificar si es un pago de inscripción (por monto o metadata)
                  const isRegistrationPayment =
                    (session.metadata?.payment_type === 'registration') ||
                    (session.amount_total === 88800) || // $888 MXN en centavos
                    (session.amount_total === 100000);  // $1000 MXN en centavos (monto anterior)

                  if (session.payment_status === 'paid' && isRegistrationPayment) {
                    const sessionDate = new Date((session.created || 0) * 1000);
                    const expiresAt = new Date(sessionDate);
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

                    // Solo actualizar si la fecha de expiración es en el futuro
                    if (expiresAt > now) {
                      const { error: updateError } = await supabase
                        .from('professional_applications')
                        .update({
                          registration_fee_paid: true,
                          registration_fee_paid_at: sessionDate.toISOString(),
                          registration_fee_expires_at: expiresAt.toISOString(),
                          registration_fee_stripe_session_id: session.id,
                        })
                        .eq('id', professional.id);

                      if (!updateError) {
                        result.registration_payment_synced = true;
                        result.payment_found_in_stripe = true;
                        result.changes_made.push(`Pago encontrado en Stripe por email (session: ${session.id.substring(0, 20)}..., fecha: ${sessionDate.toLocaleDateString('es-ES')})`);
                        totalPaymentsSynced++;
                        totalPaymentsFound++;
                        break; // Salir del loop una vez encontrado
                      } else {
                        result.errors.push(`Error al actualizar desde búsqueda: ${updateError.message}`);
                      }
                    }
                  }
                }

                if (result.payment_found_in_stripe) break;
              }
            } catch (searchError) {
              // No es crítico si falla la búsqueda por email
              console.log(`⚠️ No se pudo buscar por email para ${professional.email}:`, searchError);
            }
          }
        } else {
          result.changes_made.push('Pago ya está activo y vigente');
        }

        // ========================================
        // 2. SINCRONIZAR STRIPE CONNECT
        // ========================================

        if (professional.stripe_account_id) {
          try {
            const accountStatus = await getAccountStatus(professional.stripe_account_id);

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

            if (!updateError) {
              result.stripe_connect_synced = true;
              result.changes_made.push(`Stripe Connect actualizado: ${updateData.stripe_account_status}`);
              totalStripeConnectSynced++;
            } else {
              result.errors.push(`Error al actualizar Stripe Connect: ${updateError.message}`);
            }
          } catch (stripeError) {
            result.errors.push(`Error al verificar cuenta Stripe: ${stripeError instanceof Error ? stripeError.message : 'Error desconocido'}`);
          }
        }

      } catch (error) {
        result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }

      // Solo agregar al resultado si hubo cambios o errores
      if (result.changes_made.length > 0 || result.errors.length > 0) {
        results.push(result);
      }
    }

    console.log('✅ [Sync All] Sincronización completada');
    console.log(`   - Pagos sincronizados: ${totalPaymentsSynced}`);
    console.log(`   - Pagos encontrados en Stripe: ${totalPaymentsFound}`);
    console.log(`   - Stripe Connect sincronizados: ${totalStripeConnectSynced}`);

    return NextResponse.json({
      success: true,
      message: `Sincronización completada`,
      summary: {
        total_professionals: professionals?.length || 0,
        payments_synced: totalPaymentsSynced,
        payments_found_in_stripe: totalPaymentsFound,
        stripe_connect_synced: totalStripeConnectSynced,
      },
      details: results,
    });

  } catch (error) {
    console.error('❌ [Sync All] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
