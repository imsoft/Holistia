import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const timeRange = searchParams.get("timeRange") || "30"; // días

    // Verificar que el usuario es un profesional
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "professional") {
      return NextResponse.json(
        { error: "Solo profesionales pueden acceder a analytics" },
        { status: 403 }
      );
    }

    // Obtener retos del profesional
    let challengesQuery = supabase
      .from("challenges")
      .select("id, title")
      .eq("creator_id", user.id);

    if (challengeId) {
      challengesQuery = challengesQuery.eq("id", challengeId);
    }

    const { data: challenges } = await challengesQuery;

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({
        data: {
          overview: {
            totalParticipants: 0,
            totalCheckins: 0,
            averageCompletionRate: 0,
            totalRevenue: 0,
          },
          engagement: [],
          teamVsIndividual: {
            team: { participants: 0, completionRate: 0, avgCheckins: 0 },
            individual: { participants: 0, completionRate: 0, avgCheckins: 0 },
          },
          topChallenges: [],
          recentActivity: [],
        },
      });
    }

    const challengeIds = challenges.map((c) => c.id);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));

    // Obtener participantes totales
    const { data: purchases, count: totalParticipants } = await supabase
      .from("challenge_purchases")
      .select("*", { count: "exact" })
      .in("challenge_id", challengeIds);

    // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
    const purchaseIds = (purchases || []).map(p => p.id);
    const uniqueChallengeIds = [...new Set((purchases || []).map(p => p.challenge_id).filter((id): id is string => !!id))];
    
    // Obtener todos los datos en batch (solo 2 queries en total en lugar de 2 * N)
    const [
      allCheckinsResult,
      allChallengesResult
    ] = await Promise.allSettled([
      // Todos los checkins de todos los purchases (con filtro de fecha)
      supabase
        .from("challenge_checkins")
        .select("challenge_purchase_id, checkin_date")
        .in("challenge_purchase_id", purchaseIds)
        .gte("checkin_date", dateFrom.toISOString()),
      // Todos los challenges únicos
      supabase
        .from("challenges")
        .select("id, duration_days")
        .in("id", uniqueChallengeIds)
    ]);

    // Procesar resultados de batch queries
    const allCheckins = allCheckinsResult.status === 'fulfilled' ? (allCheckinsResult.value.data || []) : [];
    const allChallenges = allChallengesResult.status === 'fulfilled' ? (allChallengesResult.value.data || []) : [];

    // Obtener check-ins totales desde los datos ya cargados
    const totalCheckins = allCheckins.length;

    // Crear maps para acceso rápido O(1)
    const checkinsMap = new Map<string, number>();
    const checkinsByDateMap = new Map<string, number>(); // Para engagement diario
    const challengesMap = new Map<string, any>();

    // Agrupar checkins por challenge_purchase_id y por fecha
    allCheckins.forEach((checkin: any) => {
      const purchaseId = checkin.challenge_purchase_id;
      checkinsMap.set(purchaseId, (checkinsMap.get(purchaseId) || 0) + 1);
      
      // Agrupar por fecha para engagement diario
      const dateStr = checkin.checkin_date?.split('T')[0];
      if (dateStr) {
        checkinsByDateMap.set(dateStr, (checkinsByDateMap.get(dateStr) || 0) + 1);
      }
    });

    // Crear map de challenges por id
    allChallenges.forEach((challenge: any) => {
      challengesMap.set(challenge.id, challenge);
    });

    // Calcular tasa de completitud promedio (ya no necesitamos Promise.all, todo está en memoria)
    const purchaseStats = (purchases || []).map((purchase) => {
      const checkinsCount = checkinsMap.get(purchase.id) || 0;
      const challenge = challengesMap.get(purchase.challenge_id);

      const completionRate =
        challenge && checkinsCount > 0
          ? (checkinsCount / challenge.duration_days) * 100
          : 0;

      return {
        purchaseId: purchase.id,
        isTeam: !!purchase.team_id,
        completionRate,
        checkinsCount,
      };
    });

    const averageCompletionRate =
      purchaseStats.reduce((sum, stat) => sum + stat.completionRate, 0) /
      (purchaseStats.length || 1);

    // Estadísticas de equipos vs individuales
    const teamStats = purchaseStats.filter((s) => s.isTeam);
    const individualStats = purchaseStats.filter((s) => !s.isTeam);

    const teamVsIndividual = {
      team: {
        participants: teamStats.length,
        completionRate:
          teamStats.reduce((sum, s) => sum + s.completionRate, 0) /
          (teamStats.length || 1),
        avgCheckins:
          teamStats.reduce((sum, s) => sum + s.checkinsCount, 0) /
          (teamStats.length || 1),
      },
      individual: {
        participants: individualStats.length,
        completionRate:
          individualStats.reduce((sum, s) => sum + s.completionRate, 0) /
          (individualStats.length || 1),
        avgCheckins:
          individualStats.reduce((sum, s) => sum + s.checkinsCount, 0) /
          (individualStats.length || 1),
      },
    };

    // Engagement diario (últimos 30 días) - OPTIMIZADO: usar datos ya cargados
    const engagementData = [];
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Usar map de checkins por fecha ya cargado (no hacer query)
      const dailyCheckins = checkinsByDateMap.get(dateStr) || 0;

      engagementData.push({
        date: dateStr,
        checkins: dailyCheckins,
      });
    }

    // Top retos por engagement - OPTIMIZADO: usar datos ya cargados
    const purchasesByChallengeMap = new Map<string, string[]>(); // challenge_id -> purchase_ids
    const checkinsByChallengeMap = new Map<string, number>(); // challenge_id -> total checkins

    // Agrupar purchases por challenge_id
    (purchases || []).forEach((purchase: any) => {
      const challengeId = purchase.challenge_id;
      if (!purchasesByChallengeMap.has(challengeId)) {
        purchasesByChallengeMap.set(challengeId, []);
      }
      purchasesByChallengeMap.get(challengeId)!.push(purchase.id);
    });

    // Contar checkins por challenge_id
    allCheckins.forEach((checkin: any) => {
      const purchaseId = checkin.challenge_purchase_id;
      // Encontrar el challenge_id de este purchase
      const purchase = purchases?.find((p: any) => p.id === purchaseId);
      if (purchase?.challenge_id) {
        const challengeId = purchase.challenge_id;
        checkinsByChallengeMap.set(challengeId, (checkinsByChallengeMap.get(challengeId) || 0) + 1);
      }
    });

    // Calcular top challenges (ya no necesitamos Promise.all, todo está en memoria)
    const topChallenges = challenges.map((challenge) => {
      const challengePurchases = purchasesByChallengeMap.get(challenge.id) || [];
      const challengeCheckins = checkinsByChallengeMap.get(challenge.id) || 0;

      return {
        id: challenge.id,
        title: challenge.title,
        participants: challengePurchases.length,
        checkins: challengeCheckins,
        engagement:
          challengePurchases.length > 0
            ? challengeCheckins / challengePurchases.length
            : 0,
      };
    });

    topChallenges.sort((a, b) => b.engagement - a.engagement);

    // Actividad reciente
    const { data: recentActivity } = await supabase
      .from("challenge_checkins")
      .select(
        `
        id,
        checkin_date,
        challenge_purchases (
          buyer_id,
          challenge_id,
          challenges (
            title
          ),
          profiles:buyer_id (
            first_name,
            last_name,
            avatar_url
          )
        )
      `
      )
      .in(
        "challenge_purchase_id",
        purchases?.map((p) => p.id) || []
      )
      .order("checkin_date", { ascending: false })
      .limit(10);

    // Calcular ingresos totales (usar purchases ya cargados)
    const priceData = purchases || [];

    const totalRevenue = priceData.reduce(
      (sum: number, p: any) => sum + (p.price_paid || 0),
      0
    );

    return NextResponse.json({
      data: {
        overview: {
          totalParticipants: totalParticipants || 0,
          totalCheckins: totalCheckins || 0,
          averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
          totalRevenue,
        },
        engagement: engagementData,
        teamVsIndividual,
        topChallenges: topChallenges.slice(0, 5),
        recentActivity:
          recentActivity?.map((activity: any) => ({
            id: activity.id,
            date: activity.checkin_date,
            userName: `${activity.challenge_purchases?.profiles?.first_name} ${activity.challenge_purchases?.profiles?.last_name}`,
            userAvatar: activity.challenge_purchases?.profiles?.avatar_url,
            challengeTitle: activity.challenge_purchases?.challenges?.title,
          })) || [],
      },
    });
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json(
      { error: "Error al obtener analytics" },
      { status: 500 }
    );
  }
}
