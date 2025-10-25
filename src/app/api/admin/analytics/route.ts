import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint para obtener datos de analíticas con permisos de servicio
 * Esto evita problemas con RLS que impiden al admin ver todos los appointments/payments
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar que el usuario es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar tipo de usuario desde profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profile?.type !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    console.log('📊 Fetching analytics data for admin:', user.id);

    // Obtener datos con service role (bypassing RLS)
    const [
      { count: professionalsCount },
      { count: activeProfessionalsCount },
      { data: appointmentsData, error: appointmentsError },
      { data: paymentsData, error: paymentsError },
      { data: professionalsData, error: professionalsError },
    ] = await Promise.all([
      supabase.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved').eq('is_active', true),
      supabase.from('appointments').select('*'),
      supabase.from('payments').select('*').eq('status', 'succeeded'),
      supabase.from('professional_applications').select('id, first_name, last_name, profile_photo, profession').eq('status', 'approved'),
    ]);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
    }

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
    }

    if (professionalsError) {
      console.error('❌ Error fetching professionals:', professionalsError);
    }

    console.log('✅ Data fetched:');
    console.log('- Appointments:', appointmentsData?.length || 0);
    console.log('- Payments:', paymentsData?.length || 0);
    console.log('- Professionals:', professionalsCount);

    return NextResponse.json({
      professionals_count: professionalsCount || 0,
      active_professionals_count: activeProfessionalsCount || 0,
      appointments: appointmentsData || [],
      payments: paymentsData || [],
      professionals: professionalsData || [],
    });

  } catch (error) {
    console.error('❌ Error in analytics endpoint:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener datos de analíticas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
