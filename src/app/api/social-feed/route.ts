import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filterType = searchParams.get("filter") || "all"; // "all", "following", "recommended"
    const checkinId = searchParams.get("checkinId");
    const categoriesParam = searchParams.get("categories");
    const difficultiesParam = searchParams.get("difficulties");
    const searchQuery = searchParams.get("search");

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Si se solicita un post individual
    if (checkinId) {
      const { data: singleCheckin, error: singleError } = await supabase
        .from("social_feed_checkins")
        .select("*")
        .eq("checkin_id", checkinId)
        .maybeSingle();

      if (singleError || !singleCheckin) {
        return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
      }

      const [likeData, reactionData] = await Promise.all([
        supabase
          .from("challenge_checkin_likes")
          .select("id")
          .eq("checkin_id", singleCheckin.checkin_id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("post_reactions")
          .select("reaction_type")
          .eq("checkin_id", singleCheckin.checkin_id)
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      const postWithLikeStatus = {
        ...singleCheckin,
        isLikedByCurrentUser: !!likeData.data,
        userReaction: reactionData.data?.reaction_type || null,
      };

      return NextResponse.json({
        data: [postWithLikeStatus],
        count: 1,
        hasMore: false,
      });
    }

    // Obtener check-ins individuales
    let feedQuery = supabase
      .from("social_feed_checkins")
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

      feedQuery = feedQuery.in("user_id", followingIds);
    }

    // Ejecutar query
    const feedResult = await feedQuery;

    if (feedResult.error) {
      console.error("Error fetching feed:", feedResult.error);
    }

    // Obtener check-ins
    let allCheckins = feedResult.data || [];

    // Aplicar filtros avanzados
    if (categoriesParam) {
      const categories = categoriesParam.split(',');
      allCheckins = allCheckins.filter((checkin: any) =>
        categories.includes(checkin.challenge_category)
      );
    }

    if (difficultiesParam) {
      const difficulties = difficultiesParam.split(',');
      allCheckins = allCheckins.filter((checkin: any) =>
        difficulties.includes(checkin.challenge_difficulty)
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allCheckins = allCheckins.filter((checkin: any) =>
        checkin.challenge_title?.toLowerCase().includes(query) ||
        checkin.notes?.toLowerCase().includes(query) ||
        checkin.user_first_name?.toLowerCase().includes(query) ||
        checkin.user_last_name?.toLowerCase().includes(query)
      );
    }

    // Ordenar por fecha (con validación para evitar errores de fecha inválida)
    allCheckins.sort((a, b) => {
      const dateA = a.checkin_time ? new Date(a.checkin_time) : new Date(0);
      const dateB = b.checkin_time ? new Date(b.checkin_time) : new Date(0);
      
      // Si alguna fecha es inválida, usar timestamp 0
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      
      return timeB - timeA;
    });

    // Aplicar filtro de populares si es necesario
    if (filterType === "recommended") {
      allCheckins.sort((a, b) => b.likes_count - a.likes_count);
    }

    // Aplicar paginación
    const paginatedCheckins = allCheckins.slice(offset, offset + limit);

    // Para cada check-in, verificar si el usuario actual le dio like o reacción
    const dataWithLikeStatus = await Promise.all(
      paginatedCheckins.map(async (checkin: any) => {
        const [likeData, reactionData] = await Promise.all([
          supabase
            .from("challenge_checkin_likes")
            .select("id")
            .eq("checkin_id", checkin.checkin_id)
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("post_reactions")
            .select("reaction_type")
            .eq("checkin_id", checkin.checkin_id)
            .eq("user_id", user.id)
            .maybeSingle()
        ]);

        return {
          ...checkin,
          isLikedByCurrentUser: !!likeData.data,
          userReaction: reactionData.data?.reaction_type || null,
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
