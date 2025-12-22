import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting challenge checkout session creation...');
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { challenge_id } = body;

    // Validar campos requeridos
    if (!challenge_id) {
      return NextResponse.json(
        { error: 'Falta el ID del reto' },
        { status: 400 }
      );
    }

    // Verificar que el reto existe y está activo
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select(`
        *,
        professional_applications!inner(
          id,
          stripe_account_id,
          stripe_charges_enabled,
          stripe_payouts_enabled,
          first_name,
          last_name,
          is_verified
        )
      `)
      .eq('id', challenge_id)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado o no disponible' },
        { status: 404 }
      );
    }

    // Verificar que el profesional tiene Stripe Connect configurado
    const professional = challenge.professional_applications;
    if (!professional.stripe_account_id || !professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'El profesional no tiene configurado el sistema de pagos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya compró este reto
    const { data: existingPurchase } = await supabase
      .from('challenge_purchases')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('buyer_id', user.id)
      .eq('payment_status', 'succeeded')
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Ya has comprado este reto' },
        { status: 400 }
      );
    }

    // Calcular comisión (20% para Holistia, 80% para profesional)
    // Ejemplo: Si el reto cuesta $100 MXN:
    // - Holistia recibe: $20 MXN (20%)
    // - Profesional recibe: $80 MXN (80%)
    const platformFee = calculateCommission(challenge.price, 20);
    const transferAmount = calculateTransferAmount(challenge.price, 20);
    
    console.log(`💰 Comisión calculada - Precio: $${challenge.price}, Holistia (20%): $${platformFee}, Profesional (80%): $${transferAmount}`);

    // Crear registro de compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .insert({
        challenge_id: challenge_id,
        buyer_id: user.id,
        professional_id: professional.id,
        amount: challenge.price,
        currency: challenge.currency || 'MXN',
        payment_status: 'pending',
        access_granted: false,
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error('Error creating purchase record:', purchaseError);
      return NextResponse.json(
        { error: 'Error al crear el registro de compra' },
        { status: 500 }
      );
    }

    // Crear Stripe Checkout Session con Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (challenge.currency || 'mxn').toLowerCase(),
            unit_amount: formatAmountForStripe(challenge.price),
            product_data: {
              name: challenge.title,
              description: challenge.short_description || challenge.description.substring(0, 500),
              images: challenge.cover_image_url ? [challenge.cover_image_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Holistia recibe el 20% como comisión de plataforma
        application_fee_amount: formatAmountForStripe(platformFee),
        transfer_data: {
          // El profesional recibe el 80% restante
          destination: professional.stripe_account_id,
        },
      },
      metadata: {
        purchase_id: purchase.id,
        challenge_id: challenge_id,
        buyer_id: user.id,
        professional_id: professional.id,
        payment_type: 'challenge',
        platform_fee: platformFee.toString(),
        transfer_amount: transferAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore`,
      customer_email: user.email,
    });

    console.log('✅ Challenge checkout session created successfully:', checkoutSession.id);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('❌ Error creating challenge checkout session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
