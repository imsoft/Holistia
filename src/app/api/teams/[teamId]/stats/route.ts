import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { teamId } = await params;

    // Verificar que el usuario es miembro del equipo
    const { data: membership } = await supabase
      .from("challenge_team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a este equipo" },
        { status: 403 }
      );
    }

    // Obtener estadísticas del equipo desde la vista
    const { data: teamData, error: teamError } = await supabase
      .from("team_dashboard")
      .select("*")
      .eq("team_id", teamId)
      .single();

    if (teamError) {
      console.error("Error fetching team stats:", teamError);
      return NextResponse.json(
        { error: "Error al obtener estadísticas del equipo" },
        { status: 500 }
      );
    }

    // Obtener logros del equipo
    const { data: achievements, error: achievementsError } = await supabase
      .from("team_achievements")
      .select("*")
      .eq("team_id", teamId)
      .order("earned_at", { ascending: false });

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError);
    }

    // Obtener actividad de miembros individuales
    const { data: memberActivity, error: memberError } = await supabase
      .from("challenge_team_members")
      .select(`
        user_id,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("team_id", teamId);

    if (memberError) {
      console.error("Error fetching member activity:", memberError);
    }

    // Para cada miembro, obtener sus estadísticas
    const membersWithStats = await Promise.all(
      (memberActivity || []).map(async (member: any) => {
        // Contar check-ins del miembro en este equipo
        const { data: checkins } = await supabase
          .from("challenge_checkins")
          .select("id, points_earned")
          .eq("challenge_purchase_id", (
            await supabase
              .from("challenge_purchases")
              .select("id")
              .eq("buyer_id", member.user_id)
              .eq("team_id", teamId)
              .maybeSingle()
          )?.data?.id || "");

        const totalCheckins = checkins?.length || 0;
        const totalPoints = checkins?.reduce((sum: number, c: any) => sum + (c.points_earned || 0), 0) || 0;

        return {
          userId: member.user_id,
          firstName: member.profiles?.first_name,
          lastName: member.profiles?.last_name,
          avatarUrl: member.profiles?.avatar_url,
          totalCheckins,
          totalPoints,
        };
      })
    );

    return NextResponse.json({
      data: {
        team: teamData,
        achievements: achievements || [],
        members: membersWithStats,
      },
    });
  } catch (error) {
    console.error("Error in team stats API:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas del equipo" },
      { status: 500 }
    );
  }
}
