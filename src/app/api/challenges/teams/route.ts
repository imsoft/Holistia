import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener equipos del usuario
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    let query = supabase
      .from("challenge_teams")
      .select(`
        *,
        challenge:challenges(id, title, cover_image_url),
        members:challenge_team_members(
          id,
          user_id,
          joined_at,
          profile:profiles(first_name, last_name, avatar_url)
        )
      `);

    if (challengeId) {
      query = query.eq("challenge_id", challengeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Error al obtener equipos" }, { status: 500 });
  }
}

// POST - Crear equipo
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { challengeId, teamName, maxMembers } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId es requerido" },
        { status: 400 }
      );
    }

    // Validar que el usuario haya comprado el reto
    const { data: purchase, error: purchaseError } = await supabase
      .from("challenge_purchases")
      .select("id")
      .eq("participant_id", user.id)
      .eq("challenge_id", challengeId)
      .maybeSingle();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: "Debes comprar el reto para crear un equipo" },
        { status: 400 }
      );
    }

    // Validar que el usuario no esté ya en otro equipo para este reto
    const { data: existingMembership } = await supabase
      .from("challenge_team_members")
      .select(`
        id,
        team:challenge_teams(challenge_id)
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Ya estás en un equipo para este reto" },
        { status: 400 }
      );
    }

    // Crear equipo
    const { data: team, error: teamError } = await supabase
      .from("challenge_teams")
      .insert({
        challenge_id: challengeId,
        creator_id: user.id,
        team_name: teamName || null,
        max_members: maxMembers || 5,
      })
      .select()
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    // Agregar al creador como miembro del equipo
    const { error: memberError } = await supabase
      .from("challenge_team_members")
      .insert({
        team_id: team.id,
        user_id: user.id,
        challenge_purchase_id: purchase.id,
      });

    if (memberError) {
      // Rollback: eliminar el equipo si no se pudo agregar el miembro
      await supabase.from("challenge_teams").delete().eq("id", team.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Actualizar la compra para marcarla como equipo
    await supabase
      .from("challenge_purchases")
      .update({
        is_team_challenge: true,
        team_id: team.id,
      })
      .eq("id", purchase.id);

    return NextResponse.json({ data: team });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Error al crear equipo" }, { status: 500 });
  }
}
