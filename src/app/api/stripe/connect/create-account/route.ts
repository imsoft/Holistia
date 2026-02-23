import { NextRequest, NextResponse } from 'next/server';
import { createClientForRequest } from '@/utils/supabase/api-auth';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';

// Mapeo de países en español a códigos ISO de Stripe Connect
const COUNTRY_CODE_MAP: Record<string, string> = {
  'México': 'MX',
  'Mexico': 'MX',
  'España': 'ES',
  'Spain': 'ES',
  'Estados Unidos': 'US',
  'United States': 'US',
  'Argentina': 'AR',
  'Brasil': 'BR',
  'Brazil': 'BR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Costa Rica': 'CR',
  'Ecuador': 'EC',
  'El Salvador': 'SV',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'Nicaragua': 'NI',
  'Panamá': 'PA',
  'Panama': 'PA',
  'Paraguay': 'PY',
  'Perú': 'PE',
  'Peru': 'PE',
  'Uruguay': 'UY',
  'Venezuela': 'VE',
  'Canadá': 'CA',
  'Canada': 'CA',
  'Reino Unido': 'GB',
  'United Kingdom': 'GB',
  'Francia': 'FR',
  'France': 'FR',
  'Alemania': 'DE',
  'Germany': 'DE',
  'Italia': 'IT',
  'Italy': 'IT',
  'Portugal': 'PT',
  'Países Bajos': 'NL',
  'Netherlands': 'NL',
  'Bélgica': 'BE',
  'Belgium': 'BE',
  'Suiza': 'CH',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Suecia': 'SE',
  'Sweden': 'SE',
  'Noruega': 'NO',
  'Norway': 'NO',
  'Dinamarca': 'DK',
  'Denmark': 'DK',
  'Finlandia': 'FI',
  'Finland': 'FI',
  'Irlanda': 'IE',
  'Ireland': 'IE',
  'Polonia': 'PL',
  'Poland': 'PL',
  'República Checa': 'CZ',
  'Czech Republic': 'CZ',
  'Grecia': 'GR',
  'Greece': 'GR',
  'Hungría': 'HU',
  'Hungary': 'HU',
  'Rumania': 'RO',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Croacia': 'HR',
  'Croatia': 'HR',
  'Eslovaquia': 'SK',
  'Slovakia': 'SK',
  'Eslovenia': 'SI',
  'Slovenia': 'SI',
  'Estonia': 'EE',
  'Letonia': 'LV',
  'Latvia': 'LV',
  'Lituania': 'LT',
  'Lithuania': 'LT',
  'Luxemburgo': 'LU',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Chipre': 'CY',
  'Cyprus': 'CY',
  'Australia': 'AU',
  'Nueva Zelanda': 'NZ',
  'New Zealand': 'NZ',
  'Singapur': 'SG',
  'Singapore': 'SG',
  'Hong Kong': 'HK',
  'Japón': 'JP',
  'Japan': 'JP',
  'Corea del Sur': 'KR',
  'South Korea': 'KR',
  'Malasia': 'MY',
  'Malaysia': 'MY',
  'Tailandia': 'TH',
  'Thailand': 'TH',
  'Indonesia': 'ID',
  'Filipinas': 'PH',
  'Philippines': 'PH',
  'India': 'IN',
  'Emiratos Árabes Unidos': 'AE',
  'United Arab Emirates': 'AE',
  'Arabia Saudita': 'SA',
  'Saudi Arabia': 'SA',
  'Israel': 'IL',
  'Sudáfrica': 'ZA',
  'South Africa': 'ZA',
  'Egipto': 'EG',
  'Egypt': 'EG',
  'Marruecos': 'MA',
  'Morocco': 'MA',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRequest(request);

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

      // Get professional by ID first
      const { data: professional, error: professionalError } = await supabase
        .from('professional_applications')
        .select('*')
        .eq('id', professional_id)
        .single();

      if (professionalError || !professional) {
        return NextResponse.json(
          { error: 'Profesional no encontrado' },
          { status: 404 }
        );
      }

      // Verify that the professional belongs to the authenticated user
      if (professional.user_id !== user.id) {
        return NextResponse.json(
          { error: 'No tienes permiso para acceder a este profesional' },
          { status: 403 }
        );
      }

      let accountId = professional.stripe_account_id;

      // If no Stripe account exists, create one
      if (!accountId) {
        // Get country code from professional's country
        const countryCode = COUNTRY_CODE_MAP[professional.country] || 'MX';

        // Create Stripe Connect account
        accountId = await createConnectAccount(professional.email, 'individual', countryCode);

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
      }

      // Create account link for onboarding (works for new accounts and resuming incomplete onboarding)
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

