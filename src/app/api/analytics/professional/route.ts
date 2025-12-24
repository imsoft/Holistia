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

    // Obtener check-ins totales
    const { count: totalCheckins } = await supabase
      .from("challenge_checkins")
      .select("*", { count: "exact", head: true })
      .in(
        "challenge_purchase_id",
        purchases?.map((p) => p.id) || []
      )
      .gte("checkin_date", dateFrom.toISOString());

    // Calcular tasa de completitud promedio
    const purchaseStats = await Promise.all(
      (purchases || []).map(async (purchase) => {
        const { data: checkins } = await supabase
          .from("challenge_checkins")
          .select("id")
          .eq("challenge_purchase_id", purchase.id);

        const { data: challenge } = await supabase
          .from("challenges")
          .select("duration_days")
          .eq("id", purchase.challenge_id)
          .single();

        const completionRate =
          challenge && checkins
            ? (checkins.length / challenge.duration_days) * 100
            : 0;

        return {
          purchaseId: purchase.id,
          isTeam: !!purchase.team_id,
          completionRate,
          checkinsCount: checkins?.length || 0,
        };
      })
    );

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

    // Engagement diario (últimos 30 días)
    const engagementData = [];
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const { count: dailyCheckins } = await supabase
        .from("challenge_checkins")
        .select("*", { count: "exact", head: true })
        .in(
          "challenge_purchase_id",
          purchases?.map((p) => p.id) || []
        )
        .gte("checkin_date", dateStr)
        .lt("checkin_date", new Date(date.getTime() + 86400000).toISOString());

      engagementData.push({
        date: dateStr,
        checkins: dailyCheckins || 0,
      });
    }

    // Top retos por engagement
    const topChallenges = await Promise.all(
      challenges.map(async (challenge) => {
        const { data: challengePurchases } = await supabase
          .from("challenge_purchases")
          .select("id")
          .eq("challenge_id", challenge.id);

        const { count: challengeCheckins } = await supabase
          .from("challenge_checkins")
          .select("*", { count: "exact", head: true })
          .in(
            "challenge_purchase_id",
            challengePurchases?.map((p) => p.id) || []
          );

        return {
          id: challenge.id,
          title: challenge.title,
          participants: challengePurchases?.length || 0,
          checkins: challengeCheckins || 0,
          engagement:
            challengePurchases && challengePurchases.length > 0
              ? (challengeCheckins || 0) / challengePurchases.length
              : 0,
        };
      })
    );

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

    // Calcular ingresos totales
    const { data: priceData } = await supabase
      .from("challenge_purchases")
      .select("price_paid")
      .in("challenge_id", challengeIds);

    const totalRevenue = priceData?.reduce(
      (sum, p) => sum + (p.price_paid || 0),
      0
    ) || 0;

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
