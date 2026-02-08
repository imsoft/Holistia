import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';

/**
 * Crea un PaymentIntent para pagar un reto desde la app móvil.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { challenge_id } = body;
    if (!challenge_id) {
      return NextResponse.json({ error: 'Falta challenge_id' }, { status: 400 });
    }

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*, professional_applications!inner(id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, first_name, last_name)')
      .eq('id', challenge_id)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Reto no encontrado' }, { status: 404 });
    }

    const price = typeof challenge.price === 'string' ? parseFloat(challenge.price) : challenge.price;
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Este reto es gratuito' }, { status: 400 });
    }

    const professional = challenge.professional_applications;
    if (!professional.stripe_account_id || !professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'El profesional no tiene configurado el sistema de pagos', code: 'STRIPE_NOT_CONFIGURED' },
        { status: 400 }
      );
    }

    const { data: existingPurchase } = await supabase
      .from('challenge_purchases')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('participant_id', user.id)
      .eq('access_granted', true)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json({ error: 'Ya estás participando en este reto' }, { status: 400 });
    }

    const platformFee = calculateCommission(price, 15);
    const transferAmount = calculateTransferAmount(price, 15);

    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .insert({
        challenge_id,
        participant_id: user.id,
        amount: price,
        currency: challenge.currency || 'MXN',
        payment_status: 'pending',
        access_granted: false,
      })
      .select('id')
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Error al crear registro de compra' }, { status: 500 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(price),
      currency: (challenge.currency || 'mxn').toLowerCase(),
      payment_method_types: ['card'],
      application_fee_amount: formatAmountForStripe(platformFee),
      transfer_data: { destination: professional.stripe_account_id },
      metadata: {
        purchase_id: purchase.id,
        challenge_id,
        participant_id: user.id,
        professional_id: professional.id,
        payment_type: 'challenge',
        source: 'app',
      },
      receipt_email: user.email ?? undefined,
    });

    await supabase
      .from('challenge_purchases')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', purchase.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Error creating payment intent for challenge:', error);
    return NextResponse.json(
      { error: 'Error al crear intención de pago', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
