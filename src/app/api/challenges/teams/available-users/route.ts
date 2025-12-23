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

    // Obtener usuarios que sigues
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = following?.map((f) => f.following_id) || [];

    if (followingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Obtener usuarios que han comprado el reto
    const { data: purchases } = await supabase
      .from("challenge_purchases")
      .select("buyer_id")
      .eq("challenge_id", challengeId)
      .in("buyer_id", followingIds);

    const purchasedUserIds = purchases?.map((p) => p.buyer_id) || [];

    if (purchasedUserIds.length === 0) {
      return NextResponse.json({ data: [] });
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
    const availableUserIds = purchasedUserIds.filter(
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
