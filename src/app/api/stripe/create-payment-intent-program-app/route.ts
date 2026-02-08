import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';

/**
 * Crea un PaymentIntent para comprar un programa (digital product) desde la app móvil.
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
    const { product_id } = body;
    if (!product_id) {
      return NextResponse.json({ error: 'Falta product_id' }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*, professional_applications!inner(id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, first_name, last_name, is_verified)')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });
    }

    if (!product.professional_applications.is_verified) {
      return NextResponse.json({ error: 'Este programa solo está disponible de profesionales verificados' }, { status: 403 });
    }

    if (!product.price || product.price <= 0) {
      return NextResponse.json({ error: 'Este programa es gratuito' }, { status: 400 });
    }

    const professional = product.professional_applications;
    if (!professional.stripe_account_id || !professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'El profesional no tiene configurado el sistema de pagos', code: 'STRIPE_NOT_CONFIGURED' },
        { status: 400 }
      );
    }

    const { data: existingPurchase } = await supabase
      .from('digital_product_purchases')
      .select('id')
      .eq('product_id', product_id)
      .eq('buyer_id', user.id)
      .eq('payment_status', 'succeeded')
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json({ error: 'Ya has comprado este producto' }, { status: 400 });
    }

    const platformFee = calculateCommission(product.price, 15);
    const transferAmount = calculateTransferAmount(product.price, 15);

    const { data: purchase, error: purchaseError } = await supabase
      .from('digital_product_purchases')
      .insert({
        product_id,
        buyer_id: user.id,
        professional_id: professional.id,
        amount: product.price,
        currency: product.currency || 'MXN',
        payment_status: 'pending',
        access_granted: false,
      })
      .select('id')
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Error al crear registro de compra' }, { status: 500 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(product.price),
      currency: (product.currency || 'mxn').toLowerCase(),
      payment_method_types: ['card'],
      application_fee_amount: formatAmountForStripe(platformFee),
      transfer_data: { destination: professional.stripe_account_id },
      metadata: {
        purchase_id: purchase.id,
        product_id,
        buyer_id: user.id,
        professional_id: professional.id,
        payment_type: 'digital_product',
        source: 'app',
      },
      receipt_email: user.email ?? undefined,
    });

    await supabase
      .from('digital_product_purchases')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', purchase.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Error creating payment intent for program:', error);
    return NextResponse.json(
      { error: 'Error al crear intención de pago', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
