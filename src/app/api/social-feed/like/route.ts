import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { checkinId } = await request.json();

    if (!checkinId) {
      return NextResponse.json({ error: "checkinId es requerido" }, { status: 400 });
    }

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que el check-in existe y es público
    const { data: checkin } = await supabase
      .from("challenge_checkins")
      .select("id, is_public")
      .eq("id", checkinId)
      .single();

    if (!checkin || !checkin.is_public) {
      return NextResponse.json({ error: "Check-in no encontrado o no público" }, { status: 404 });
    }

    // Dar like
    const { error: likeError } = await supabase
      .from("challenge_checkin_likes")
      .insert({
        checkin_id: checkinId,
        user_id: user.id,
      });

    if (likeError) {
      // Si ya dio like, el error será por unique constraint
      if (likeError.code === "23505") {
        return NextResponse.json({ error: "Ya diste like a este check-in" }, { status: 400 });
      }
      return NextResponse.json({ error: likeError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in like API:", error);
    return NextResponse.json({ error: "Error al dar like" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const checkinId = searchParams.get("checkinId");

    if (!checkinId) {
      return NextResponse.json({ error: "checkinId es requerido" }, { status: 400 });
    }

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Quitar like
    const { error: unlikeError } = await supabase
      .from("challenge_checkin_likes")
      .delete()
      .eq("checkin_id", checkinId)
      .eq("user_id", user.id);

    if (unlikeError) {
      return NextResponse.json({ error: unlikeError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in unlike API:", error);
    return NextResponse.json({ error: "Error al quitar like" }, { status: 500 });
  }
}
