import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface MonthlyData {
  month: string;
  count: number;
}

/**
 * API endpoint para obtener datos de analíticas con permisos de servicio
 * Incluye datos de todas las entidades: profesionales, citas, programas, eventos, retos, comercios, centros, restaurantes
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

    // Obtener datos de los últimos 6 meses para gráficos
    const now = new Date();
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    // Todas las consultas en paralelo
    const [
      professionalsResult,
      activeProfessionalsResult,
      appointmentsResult,
      paymentsResult,
      professionalsData,
      patientsData,
      // Entidades adicionales
      digitalProductsResult,
      activeDigitalProductsResult,
      eventsResult,
      activeEventsResult,
      eventRegistrationsResult,
      challengesResult,
      activeChallengesResult,
      shopsResult,
      activeShopsResult,
      holisticCentersResult,
      activeHolisticCentersResult,
      restaurantsResult,
      activeRestaurantsResult,
    ] = await Promise.all([
      supabase.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved').eq('is_active', true),
      supabase.from('appointments').select('id, patient_id, professional_id, status, appointment_type, appointment_date, created_at'),
      supabase.from('payments').select('*').eq('status', 'succeeded'),
      supabase.from('professional_applications').select('id, first_name, last_name, profile_photo, profession, reviewed_at, created_at').eq('status', 'approved'),
      supabase.from('profiles').select('id, first_name, last_name, email, avatar_url').eq('type', 'patient').eq('account_active', true),
      supabase.from('digital_products').select('id, created_at, is_active'),
      supabase.from('digital_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('events_workshops').select('id, created_at, is_active'),
      supabase.from('events_workshops').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('event_registrations').select('id, event_id, created_at'),
      supabase.from('challenges').select('id, created_at, is_active'),
      supabase.from('challenges').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('shops').select('id, created_at, is_active'),
      supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('holistic_centers').select('id, created_at, is_active'),
      supabase.from('holistic_centers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('restaurants').select('id, created_at, is_active'),
      supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    // Helper para agrupar por mes (usa created_at o dateField)
    const groupByMonth = (items: { created_at?: string; [key: string]: unknown }[] | null, dateField = 'created_at'): MonthlyData[] => {
      const counts: Record<string, number> = {};
      monthLabels.forEach(m => { counts[m] = 0; });
      (items || []).forEach(item => {
        const dateStr = (item[dateField] || item.created_at) as string | undefined;
        if (dateStr) {
          const month = dateStr.slice(0, 7);
          if (counts[month] !== undefined) counts[month]++;
        }
      });
      return monthLabels.map(month => ({ month, count: counts[month] || 0 }));
    };

    const appointmentsData = appointmentsResult.data || [];
    const paymentsData = paymentsResult.data || [];
    const eventRegistrationsData = eventRegistrationsResult.data || [];

    // Agrupar registros de eventos por mes
    const eventRegistrationsByMonth = groupByMonth(eventRegistrationsData, 'created_at');

    // Agrupar citas por mes
    const appointmentsByMonth = groupByMonth(appointmentsData, 'created_at');

    // Datos mensuales por entidad (professionals usa reviewed_at si existe)
    const professionalsByMonth = groupByMonth(
      (professionalsData?.data || []).map((p: { reviewed_at?: string; created_at?: string }) => ({
        created_at: p.reviewed_at || p.created_at
      })),
      'created_at'
    );
    const digitalProductsByMonth = groupByMonth(digitalProductsResult.data || [], 'created_at');
    const eventsByMonth = groupByMonth(eventsResult.data || [], 'created_at');
    const challengesByMonth = groupByMonth(challengesResult.data || [], 'created_at');
    const shopsByMonth = groupByMonth(shopsResult.data || [], 'created_at');
    const holisticCentersByMonth = groupByMonth(holisticCentersResult.data || [], 'created_at');
    const restaurantsByMonth = groupByMonth(restaurantsResult.data || [], 'created_at');

    const totalRevenue = paymentsData.reduce((sum: number, p: { amount?: string | number }) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
      return sum + amount;
    }, 0);

    return NextResponse.json({
      // Datos existentes
      professionals_count: professionalsResult.count || 0,
      active_professionals_count: activeProfessionalsResult.count || 0,
      appointments: appointmentsData,
      payments: paymentsData,
      professionals: professionalsData.data || [],
      patients: patientsData.data || [],
      total_revenue: totalRevenue,
      // Nuevas entidades - counts
      digital_products: { total: digitalProductsResult.data?.length || 0, active: activeDigitalProductsResult.count || 0 },
      events: { total: eventsResult.data?.length || 0, active: activeEventsResult.count || 0 },
      event_registrations_count: eventRegistrationsData.length,
      challenges: { total: challengesResult.data?.length || 0, active: activeChallengesResult.count || 0 },
      shops: { total: shopsResult.data?.length || 0, active: activeShopsResult.count || 0 },
      holistic_centers: { total: holisticCentersResult.data?.length || 0, active: activeHolisticCentersResult.count || 0 },
      restaurants: { total: restaurantsResult.data?.length || 0, active: activeRestaurantsResult.count || 0 },
      // Datos para gráficos - tendencias mensuales
      charts: {
        appointments: appointmentsByMonth,
        professionals: professionalsByMonth,
        digital_products: digitalProductsByMonth,
        events: eventsByMonth,
        event_registrations: eventRegistrationsByMonth,
        challenges: challengesByMonth,
        shops: shopsByMonth,
        holistic_centers: holisticCentersByMonth,
        restaurants: restaurantsByMonth,
        month_labels: monthLabels,
      },
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
