import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Endpoint de diagnóstico para verificar la configuración del webhook
 * Solo accesible para administradores
 */
export async function GET() {
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

    console.log('🔍 [Webhook Diagnostics] Verificando configuración...');

    // Obtener todos los webhooks configurados
    const webhooks = await stripe.webhookEndpoints.list({
      limit: 100,
    });

    const webhookInfo = webhooks.data.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      status: webhook.status,
      enabled_events: webhook.enabled_events,
      api_version: webhook.api_version,
      created: new Date(webhook.created * 1000).toISOString(),
    }));

    // Verificar que exista el webhook correcto
    const productionWebhook = webhooks.data.find(
      w => w.url.includes('holistia.io/api/stripe/webhook')
    );

    const requiredEvents = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.succeeded',
      'charge.refunded',
    ];

    const diagnostics = {
      webhook_configured: !!productionWebhook,
      webhook_url: productionWebhook?.url || null,
      webhook_status: productionWebhook?.status || null,
      webhook_id: productionWebhook?.id || null,
      enabled_events: productionWebhook?.enabled_events || [],
      missing_events: requiredEvents.filter(
        event => !productionWebhook?.enabled_events.includes(event)
      ),
      api_version: productionWebhook?.api_version || null,
      total_webhooks: webhooks.data.length,
      all_webhooks: webhookInfo,
    };

    // Verificar si hay eventos recientes
    if (productionWebhook) {
      try {
        const events = await stripe.events.list({
          limit: 10,
          types: ['checkout.session.completed'],
        });

        diagnostics['recent_events_count'] = events.data.length;
        diagnostics['recent_events'] = events.data.map(event => ({
          id: event.id,
          type: event.type,
          created: new Date(event.created * 1000).toISOString(),
          pending_webhooks: event.pending_webhooks,
        }));
      } catch (error) {
        console.error('Error fetching recent events:', error);
      }
    }

    return NextResponse.json({
      status: 'ok',
      diagnostics,
      recommendations: [
        !productionWebhook && 'No se encontró webhook configurado para producción',
        diagnostics.missing_events.length > 0 && `Faltan eventos: ${diagnostics.missing_events.join(', ')}`,
        productionWebhook?.status !== 'enabled' && 'El webhook no está habilitado',
      ].filter(Boolean),
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
