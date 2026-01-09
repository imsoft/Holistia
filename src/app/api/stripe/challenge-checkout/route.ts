import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { challenge_id } = body;

    if (!challenge_id) {
      return NextResponse.json(
        { error: 'Falta el ID del reto' },
        { status: 400 }
      );
    }

    // Verificar que el reto existe y obtener información completa
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
          last_name
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

    // Si el reto es gratuito, unirse directamente
    if (!challenge.price || challenge.price <= 0) {
      // Verificar si ya está participando
      const { data: existingParticipation } = await supabase
        .from('challenge_purchases')
        .select('id')
        .eq('challenge_id', challenge_id)
        .eq('participant_id', user.id)
        .maybeSingle();

      if (existingParticipation) {
        return NextResponse.json(
          { error: 'Ya estás participando en este reto' },
          { status: 400 }
        );
      }

      // Crear participación (gratis)
      const { error: participationError } = await supabase
        .from('challenge_purchases')
        .insert({
          challenge_id: challenge_id,
          participant_id: user.id,
          access_granted: true,
        });

      if (participationError) {
        console.error('Error creating challenge participation:', participationError);
        return NextResponse.json(
          { error: 'Error al unirse al reto' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Te has unido al reto exitosamente',
      });
    }

    // Si tiene precio, crear sesión de checkout con Stripe
    const professional = challenge.professional_applications;

    if (!professional.stripe_account_id) {
      return NextResponse.json(
        { error: 'El profesional no tiene configurado el método de pago' },
        { status: 400 }
      );
    }

    if (!professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'El profesional no tiene habilitado el procesamiento de pagos' },
        { status: 400 }
      );
    }

    // Verificar si ya está participando
    const { data: existingParticipation } = await supabase
      .from('challenge_purchases')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('participant_id', user.id)
      .maybeSingle();

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Ya estás participando en este reto' },
        { status: 400 }
      );
    }

    // Calcular comisiones (15% para retos)
    const price = typeof challenge.price === 'string' ? parseFloat(challenge.price) : challenge.price;
    const platformFee = calculateCommission(price, 15); // 15% para retos
    const transferAmount = calculateTransferAmount(price, 15); // 15% para retos

    // Crear registro de compra pendiente
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .insert({
        challenge_id: challenge_id,
        participant_id: user.id,
        amount: price,
        currency: challenge.currency || 'MXN',
        payment_status: 'pending',
        access_granted: false,
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error('Error creating challenge purchase:', purchaseError);
      return NextResponse.json(
        { error: 'Error al crear el registro de compra' },
        { status: 500 }
      );
    }

    // Crear sesión de Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
            price_data: {
              currency: (challenge.currency || 'mxn').toLowerCase(),
              unit_amount: formatAmountForStripe(price),
              product_data: {
                name: challenge.title,
                description: challenge.description?.substring(0, 500).replace(/<[^>]*>/g, '') || '',
                images: challenge.cover_image_url ? [challenge.cover_image_url] : [],
              },
            },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: formatAmountForStripe(platformFee),
        transfer_data: {
          destination: professional.stripe_account_id,
        },
      },
      metadata: {
        purchase_id: purchase.id,
        challenge_id: challenge_id,
        participant_id: user.id,
        professional_id: professional.id,
        payment_type: 'challenge',
        platform_fee: platformFee.toString(),
        transfer_amount: transferAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/my-challenges?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore/challenge/${challenge_id}`,
      customer_email: user.email,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('❌ Error in challenge checkout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
