import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener usuarios disponibles para invitar a un equipo
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const challengeId = searchParams.get("challengeId");

    if (!teamId || !challengeId) {
      return NextResponse.json(
        { error: "teamId y challengeId son requeridos" },
        { status: 400 }
      );
    }

    // Obtener información del reto para saber si es gratuito
    const { data: challengeData, error: challengeError } = await supabase
      .from("challenges")
      .select("created_by_type")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challengeData) {
      return NextResponse.json(
        { error: "Reto no encontrado" },
        { status: 404 }
      );
    }

    // Si el reto fue creado por un paciente, es gratuito (no requiere compra)
    const isFreeChallenge = challengeData.created_by_type === 'patient';

    // Obtener usuarios que sigues
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = following?.map((f) => f.following_id) || [];

    if (followingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Si es un reto gratuito, todos los usuarios que sigues son elegibles
    // Si es un reto de pago, solo los que han comprado el reto son elegibles
    let eligibleUserIds: string[] = [];

    if (isFreeChallenge) {
      // Para retos gratuitos, todos los usuarios que sigues son elegibles
      eligibleUserIds = followingIds;
    } else {
      // Para retos de pago, solo usuarios que han comprado el reto
      const { data: purchases } = await supabase
        .from("challenge_purchases")
        .select("participant_id")
        .eq("challenge_id", challengeId)
        .in("participant_id", followingIds);

      eligibleUserIds = purchases?.map((p) => p.participant_id) || [];

      if (eligibleUserIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
    }

    // Obtener usuarios que ya están en el equipo
    const { data: teamMembers } = await supabase
      .from("challenge_team_members")
      .select("user_id")
      .eq("team_id", teamId);

    const teamMemberIds = teamMembers?.map((m) => m.user_id) || [];

    // Obtener invitaciones pendientes
    const { data: pendingInvitations } = await supabase
      .from("challenge_team_invitations")
      .select("invitee_id")
      .eq("team_id", teamId)
      .eq("status", "pending");

    const invitedUserIds = pendingInvitations?.map((i) => i.invitee_id) || [];

    // Filtrar usuarios disponibles (que no estén en el equipo ni hayan sido invitados)
    const availableUserIds = eligibleUserIds.filter(
      (id) => !teamMemberIds.includes(id) && !invitedUserIds.includes(id)
    );

    if (availableUserIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Obtener perfiles de usuarios disponibles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", availableUserIds);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    return NextResponse.json({ data: profiles || [] });
  } catch (error) {
    console.error("Error fetching available users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios disponibles" },
      { status: 500 }
    );
  }
}
