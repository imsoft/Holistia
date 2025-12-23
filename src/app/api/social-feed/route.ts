import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filterType = searchParams.get("filter") || "all"; // "all", "following", "recommended"

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let query = supabase
      .from("social_feed_checkins")
      .select("*")
      .order("checkin_time", { ascending: false });

    // Filtrar según el tipo
    if (filterType === "following") {
      // Obtener IDs de usuarios que sigue
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        // Si no sigue a nadie, devolver array vacío
        return NextResponse.json({
          data: [],
          count: 0,
          hasMore: false
        });
      }

      query = query.in("user_id", followingIds);
    } else if (filterType === "recommended") {
      // Obtener intereses del usuario desde su perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("type")
        .eq("id", user.id)
        .single();

      // Recomendar basado en categorías populares o aleatorio
      // Por ahora mostramos todos los públicos ordenados por likes
      query = query.order("likes_count", { ascending: false });
    }

    // Aplicar paginación
    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching social feed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Para cada check-in, verificar si el usuario actual le dio like
    const dataWithLikeStatus = await Promise.all(
      (data || []).map(async (checkin) => {
        const { data: likeData } = await supabase
          .from("challenge_checkin_likes")
          .select("id")
          .eq("checkin_id", checkin.checkin_id)
          .eq("user_id", user.id)
          .maybeSingle();

        return {
          ...checkin,
          isLikedByCurrentUser: !!likeData,
        };
      })
    );

    return NextResponse.json({
      data: dataWithLikeStatus,
      count: count || 0,
      hasMore: (data?.length || 0) === limit,
    });
  } catch (error) {
    console.error("Error in social feed API:", error);
    return NextResponse.json(
      { error: "Error al obtener el feed" },
      { status: 500 }
    );
  }
}
