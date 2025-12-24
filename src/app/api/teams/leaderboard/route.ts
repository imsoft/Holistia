import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId es requerido" },
        { status: 400 }
      );
    }

    // Obtener leaderboard del reto
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from("team_leaderboard")
      .select(`
        *,
        team:team_id (
          id,
          team_name,
          created_at,
          max_members
        )
      `)
      .eq("challenge_id", challengeId)
      .order("rank", { ascending: true })
      .limit(100);

    if (leaderboardError) {
      console.error("Error fetching leaderboard:", leaderboardError);
      return NextResponse.json(
        { error: "Error al obtener leaderboard" },
        { status: 500 }
      );
    }

    // Para cada equipo, obtener cantidad de miembros y avatares
    const enrichedLeaderboard = await Promise.all(
      (leaderboard || []).map(async (entry: any) => {
        const { data: members } = await supabase
          .from("challenge_team_members")
          .select(`
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq("team_id", entry.team_id)
          .limit(5); // Solo primeros 5 para mostrar avatares

        return {
          ...entry,
          memberCount: members?.length || 0,
          memberAvatars: members?.map((m: any) => ({
            firstName: m.profiles?.first_name,
            lastName: m.profiles?.last_name,
            avatarUrl: m.profiles?.avatar_url,
          })) || [],
        };
      })
    );

    return NextResponse.json({
      data: enrichedLeaderboard,
    });
  } catch (error) {
    console.error("Error in leaderboard API:", error);
    return NextResponse.json(
      { error: "Error al obtener leaderboard" },
      { status: 500 }
    );
  }
}

// POST - Refrescar leaderboard manualmente (admin/cron)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { challengeId } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId es requerido" },
        { status: 400 }
      );
    }

    // Llamar a la función para refrescar el leaderboard
    const { error } = await supabase.rpc("refresh_team_leaderboard", {
      p_challenge_id: challengeId,
    });

    if (error) {
      console.error("Error refreshing leaderboard:", error);
      return NextResponse.json(
        { error: "Error al actualizar leaderboard" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in refresh leaderboard API:", error);
    return NextResponse.json(
      { error: "Error al actualizar leaderboard" },
      { status: 500 }
    );
  }
}
