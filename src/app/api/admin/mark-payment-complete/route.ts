import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint para marcar manualmente el pago de inscripción como completado
 * Útil cuando el admin está seguro de que el profesional pagó pero el sistema no lo detecta
 * También busca en Stripe para verificar si hay algún pago asociado al email
 *
 * Solo accesible para administradores
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { professional_application_id, notes, payment_date } = body;

    if (!professional_application_id) {
      return NextResponse.json(
        { error: "Debes proporcionar professional_application_id" },
        { status: 400 }
      );
    }

    console.log('🔵 [Mark Payment] Marcando pago como completado...', { professional_application_id });

    // 1. Obtener la aplicación
    const { data: application, error: appError } = await supabase
      .from('professional_applications')
      .select('id, email, first_name, last_name, registration_fee_paid')
      .eq('id', professional_application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: `Aplicación no encontrada: ${appError?.message}` },
        { status: 404 }
      );
    }

    // 2. Intentar buscar el pago en Stripe antes de marcar manualmente
    let stripePaymentInfo = null;

    try {
      // Buscar por email en Stripe
      const customers = await stripe.customers.list({
        email: application.email,
        limit: 5,
      });

      for (const customer of customers.data) {
        // Buscar charges del cliente
        const charges = await stripe.charges.list({
          customer: customer.id,
          limit: 20,
        });

        const successfulCharges = charges.data.filter(c => c.status === 'succeeded');
        
        if (successfulCharges.length > 0) {
          // Tomar el cargo más reciente
          const latestCharge = successfulCharges[0];
          stripePaymentInfo = {
            charge_id: latestCharge.id,
            amount: latestCharge.amount / 100,
            currency: latestCharge.currency,
            date: new Date((latestCharge.created || 0) * 1000).toISOString(),
            receipt_url: latestCharge.receipt_url,
          };
          console.log('✅ [Mark Payment] Pago encontrado en Stripe:', stripePaymentInfo);
          break;
        }

        // También buscar payment intents
        const paymentIntents = await stripe.paymentIntents.list({
          customer: customer.id,
          limit: 20,
        });

        const succeededIntents = paymentIntents.data.filter(pi => pi.status === 'succeeded');
        
        if (succeededIntents.length > 0) {
          const latestIntent = succeededIntents[0];
          stripePaymentInfo = {
            payment_intent_id: latestIntent.id,
            amount: latestIntent.amount / 100,
            currency: latestIntent.currency,
            date: new Date((latestIntent.created || 0) * 1000).toISOString(),
          };
          console.log('✅ [Mark Payment] PaymentIntent encontrado en Stripe:', stripePaymentInfo);
          break;
        }
      }

      // También buscar en charges por email de receipt
      if (!stripePaymentInfo) {
        const allCharges = await stripe.charges.list({
          limit: 100,
        });

        const matchingCharge = allCharges.data.find(c => 
          c.status === 'succeeded' && 
          (c.receipt_email?.toLowerCase() === application.email.toLowerCase() ||
           c.billing_details?.email?.toLowerCase() === application.email.toLowerCase())
        );

        if (matchingCharge) {
          stripePaymentInfo = {
            charge_id: matchingCharge.id,
            amount: matchingCharge.amount / 100,
            currency: matchingCharge.currency,
            date: new Date((matchingCharge.created || 0) * 1000).toISOString(),
            receipt_url: matchingCharge.receipt_url,
          };
          console.log('✅ [Mark Payment] Charge encontrado por receipt_email:', stripePaymentInfo);
        }
      }
    } catch (stripeError) {
      console.log('⚠️ [Mark Payment] Error al buscar en Stripe:', stripeError);
    }

    // 3. Determinar la fecha del pago
    let paidAt: Date;
    if (stripePaymentInfo?.date) {
      paidAt = new Date(stripePaymentInfo.date);
    } else if (payment_date) {
      paidAt = new Date(payment_date);
    } else {
      paidAt = new Date();
    }

    const expiresAt = new Date(paidAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // 4. Actualizar la aplicación profesional
    const { error: updateError } = await supabase
      .from('professional_applications')
      .update({
        registration_fee_paid: true,
        registration_fee_paid_at: paidAt.toISOString(),
        registration_fee_expires_at: expiresAt.toISOString(),
        registration_fee_amount: stripePaymentInfo?.amount || 888,
        registration_fee_currency: stripePaymentInfo?.currency || 'mxn',
      })
      .eq('id', professional_application_id);

    if (updateError) {
      console.error('❌ [Mark Payment] Error al actualizar aplicación:', updateError);
      return NextResponse.json({
        success: false,
        error: `Error al actualizar la aplicación: ${updateError.message}`,
      }, { status: 500 });
    }

    // 5. Crear o actualizar el registro de pago
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('professional_application_id', professional_application_id)
      .eq('payment_type', 'registration')
      .single();

    if (existingPayment) {
      await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          paid_at: paidAt.toISOString(),
          amount: stripePaymentInfo?.amount || 888,
          currency: stripePaymentInfo?.currency || 'mxn',
          stripe_payment_intent_id: stripePaymentInfo?.payment_intent_id || stripePaymentInfo?.charge_id,
          transfer_status: 'completed',
          metadata: {
            marked_manually: true,
            marked_by: user.id,
            marked_at: new Date().toISOString(),
            notes: notes || 'Pago marcado manualmente por administrador',
            stripe_info: stripePaymentInfo,
          },
        })
        .eq('id', existingPayment.id);
    } else {
      await supabase
        .from('payments')
        .insert({
          professional_application_id,
          payment_type: 'registration',
          status: 'succeeded',
          paid_at: paidAt.toISOString(),
          amount: stripePaymentInfo?.amount || 888,
          currency: stripePaymentInfo?.currency || 'mxn',
          stripe_payment_intent_id: stripePaymentInfo?.payment_intent_id || stripePaymentInfo?.charge_id,
          transfer_status: 'completed',
          metadata: {
            marked_manually: true,
            marked_by: user.id,
            marked_at: new Date().toISOString(),
            notes: notes || 'Pago marcado manualmente por administrador',
            stripe_info: stripePaymentInfo,
          },
        });
    }

    console.log('✅ [Mark Payment] Pago marcado como completado para:', application.first_name, application.last_name);

    return NextResponse.json({
      success: true,
      message: `Pago marcado como completado para ${application.first_name} ${application.last_name}`,
      professional_application_id,
      registration_fee_paid: true,
      registration_fee_paid_at: paidAt.toISOString(),
      registration_fee_expires_at: expiresAt.toISOString(),
      stripe_payment_found: !!stripePaymentInfo,
      stripe_payment_info: stripePaymentInfo,
    });

  } catch (error) {
    console.error('❌ [Mark Payment] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * GET: Buscar todos los pagos de un profesional en Stripe
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Debes proporcionar un email" },
        { status: 400 }
      );
    }

    console.log('🔍 [Search Stripe] Buscando pagos para:', email);

    const results: {
      customers: Array<{
        id: string;
        email: string;
        name: string | null;
        created: string;
      }>;
      charges: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: string;
        receipt_url: string | null;
        description: string | null;
      }>;
      payment_intents: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: string;
        description: string | null;
      }>;
      checkout_sessions: Array<{
        id: string;
        amount_total: number | null;
        currency: string | null;
        status: string | null;
        payment_status: string;
        created: string;
      }>;
    } = {
      customers: [],
      charges: [],
      payment_intents: [],
      checkout_sessions: [],
    };

    try {
      // Buscar clientes
      const customers = await stripe.customers.list({
        email: email,
        limit: 10,
      });

      results.customers = customers.data.map(c => ({
        id: c.id,
        email: c.email || '',
        name: c.name || null,
        created: new Date((c.created || 0) * 1000).toISOString(),
      }));

      // Para cada cliente, buscar sus pagos
      for (const customer of customers.data) {
        const charges = await stripe.charges.list({
          customer: customer.id,
          limit: 20,
        });

        results.charges.push(...charges.data.map(c => ({
          id: c.id,
          amount: c.amount / 100,
          currency: c.currency,
          status: c.status,
          created: new Date((c.created || 0) * 1000).toISOString(),
          receipt_url: c.receipt_url,
          description: c.description,
        })));

        const paymentIntents = await stripe.paymentIntents.list({
          customer: customer.id,
          limit: 20,
        });

        results.payment_intents.push(...paymentIntents.data.map(pi => ({
          id: pi.id,
          amount: pi.amount / 100,
          currency: pi.currency,
          status: pi.status,
          created: new Date((pi.created || 0) * 1000).toISOString(),
          description: pi.description,
        })));

        const sessions = await stripe.checkout.sessions.list({
          customer: customer.id,
          limit: 20,
        });

        results.checkout_sessions.push(...sessions.data.map(s => ({
          id: s.id,
          amount_total: s.amount_total ? s.amount_total / 100 : null,
          currency: s.currency,
          status: s.status,
          payment_status: s.payment_status,
          created: new Date((s.created || 0) * 1000).toISOString(),
        })));
      }

      // También buscar charges por receipt_email
      const chargesByEmail = await stripe.charges.list({
        limit: 100,
      });

      const matchingCharges = chargesByEmail.data.filter(c => 
        c.receipt_email?.toLowerCase() === email.toLowerCase() ||
        c.billing_details?.email?.toLowerCase() === email.toLowerCase()
      );

      for (const c of matchingCharges) {
        if (!results.charges.find(existing => existing.id === c.id)) {
          results.charges.push({
            id: c.id,
            amount: c.amount / 100,
            currency: c.currency,
            status: c.status,
            created: new Date((c.created || 0) * 1000).toISOString(),
            receipt_url: c.receipt_url,
            description: c.description,
          });
        }
      }
    } catch (stripeError) {
      console.error('⚠️ [Search Stripe] Error:', stripeError);
    }

    return NextResponse.json({
      email,
      results,
      summary: {
        total_customers: results.customers.length,
        total_charges: results.charges.length,
        successful_charges: results.charges.filter(c => c.status === 'succeeded').length,
        total_payment_intents: results.payment_intents.length,
        successful_payment_intents: results.payment_intents.filter(pi => pi.status === 'succeeded').length,
        total_checkout_sessions: results.checkout_sessions.length,
        paid_checkout_sessions: results.checkout_sessions.filter(s => s.payment_status === 'paid').length,
      },
    });

  } catch (error) {
    console.error('❌ [Search Stripe] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
