import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting digital product checkout session creation...');
    const supabase = await createClient();

    // Verify user is authenticated
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
    const { product_id } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Check if product exists and is active
    const { data: product, error: productError } = await supabase
      .from('digital_products')
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
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Producto no encontrado o no disponible' },
        { status: 404 }
      );
    }

    // Verify professional is verified
    if (!product.professional_applications.is_verified) {
      return NextResponse.json(
        { error: 'Este producto solo está disponible de profesionales verificados' },
        { status: 403 }
      );
    }

    // Check if user already purchased this product
    const { data: existingPurchase } = await supabase
      .from('digital_product_purchases')
      .select('id')
      .eq('product_id', product_id)
      .eq('buyer_id', user.id)
      .eq('payment_status', 'succeeded')
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Ya has comprado este producto' },
        { status: 400 }
      );
    }

    // Check if professional has Stripe Connect enabled
    const professional = product.professional_applications;
    if (!professional.stripe_account_id || !professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'El profesional no tiene configurado el sistema de pagos' },
        { status: 400 }
      );
    }

    // Calculate platform fee (15% for Holistia, 85% for professional)
    // Ejemplo: Si el producto cuesta $100 MXN:
    // - Holistia recibe: $15 MXN (15%)
    // - Profesional recibe: $85 MXN (85%)
    const platformFee = calculateCommission(product.price, 15);
    const transferAmount = calculateTransferAmount(product.price, 15);
    
    console.log(`💰 Comisión calculada - Precio: $${product.price}, Holistia (15%): $${platformFee}, Profesional (85%): $${transferAmount}`);

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('digital_product_purchases')
      .insert({
        product_id: product_id,
        buyer_id: user.id,
        professional_id: professional.id,
        amount: product.price,
        currency: product.currency || 'MXN',
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

    // Create Stripe Checkout Session with Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (product.currency || 'mxn').toLowerCase(),
            unit_amount: formatAmountForStripe(product.price),
            product_data: {
              name: product.title,
              description: product.description.substring(0, 500), // Stripe limit
              images: product.cover_image_url ? [product.cover_image_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Holistia recibe el 15% como comisión de plataforma
        application_fee_amount: formatAmountForStripe(platformFee),
        transfer_data: {
          // El profesional recibe el 85% restante
          destination: professional.stripe_account_id,
        },
      },
      metadata: {
        purchase_id: purchase.id,
        product_id: product_id,
        buyer_id: user.id,
        professional_id: professional.id,
        payment_type: 'digital_product',
        platform_fee: platformFee.toString(),
        transfer_amount: transferAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore/professional/${professional.id}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore/professional/${professional.id}`,
      customer_email: user.email,
    });

    // Note: stripe_payment_intent_id will be updated by the webhook when payment succeeds

    console.log('✅ Digital product checkout session created successfully:', checkoutSession.id);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('❌ Error creating digital product checkout session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
