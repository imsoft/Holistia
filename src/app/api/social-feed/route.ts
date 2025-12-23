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

    // Obtener check-ins individuales y de equipos
    let individualQuery = supabase
      .from("social_feed_checkins")
      .select("*");

    let teamQuery = supabase
      .from("team_feed_checkins")
      .select("*");

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

      individualQuery = individualQuery.in("user_id", followingIds);
      teamQuery = teamQuery.in("user_id", followingIds);
    }

    // Ejecutar ambas queries
    const [individualResult, teamResult] = await Promise.all([
      individualQuery,
      teamQuery,
    ]);

    if (individualResult.error) {
      console.error("Error fetching individual feed:", individualResult.error);
    }

    if (teamResult.error) {
      console.error("Error fetching team feed:", teamResult.error);
    }

    // Combinar y marcar el tipo
    const individualCheckins = (individualResult.data || []).map((item: any) => ({
      ...item,
      is_team: false,
    }));

    const teamCheckins = (teamResult.data || []).map((item: any) => ({
      ...item,
      is_team: true,
    }));

    // Combinar ambos arrays
    let allCheckins = [...individualCheckins, ...teamCheckins];

    // Ordenar por fecha
    allCheckins.sort((a, b) => {
      return new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime();
    });

    // Aplicar filtro de populares si es necesario
    if (filterType === "recommended") {
      allCheckins.sort((a, b) => b.likes_count - a.likes_count);
    }

    // Aplicar paginación
    const paginatedCheckins = allCheckins.slice(offset, offset + limit);

    // Para cada check-in, verificar si el usuario actual le dio like
    const dataWithLikeStatus = await Promise.all(
      paginatedCheckins.map(async (checkin: any) => {
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
      count: allCheckins.length,
      hasMore: offset + limit < allCheckins.length,
    });
  } catch (error) {
    console.error("Error in social feed API:", error);
    return NextResponse.json(
      { error: "Error al obtener el feed" },
      { status: 500 }
    );
  }
}
