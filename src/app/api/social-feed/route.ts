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

    // Construir query con filtros, ordenamiento y paginación en la base de datos
    let feedQuery = supabase
      .from("social_feed_checkins")
      .select("*", { count: "exact" });

    // Filtrar según el tipo
    if (filterType === "following") {
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        return NextResponse.json({
          data: [],
          count: 0,
          hasMore: false
        });
      }

      feedQuery = feedQuery.in("user_id", followingIds);
    }

    // Filtros avanzados en la base de datos
    if (categoriesParam) {
      const categories = categoriesParam.split(',');
      feedQuery = feedQuery.in("challenge_category", categories);
    }

    if (difficultiesParam) {
      const difficulties = difficultiesParam.split(',');
      feedQuery = feedQuery.in("challenge_difficulty", difficulties);
    }

    if (searchQuery) {
      feedQuery = feedQuery.or(
        `challenge_title.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,user_first_name.ilike.%${searchQuery}%,user_last_name.ilike.%${searchQuery}%`
      );
    }

    // Ordenamiento en la base de datos
    if (filterType === "recommended") {
      feedQuery = feedQuery.order("likes_count", { ascending: false });
    } else {
      feedQuery = feedQuery.order("checkin_time", { ascending: false, nullsFirst: false });
    }

    // Paginación en la base de datos
    feedQuery = feedQuery.range(offset, offset + limit - 1);

    const feedResult = await feedQuery;

    if (feedResult.error) {
      console.error("Error fetching feed:", feedResult.error);
    }

    const paginatedCheckins = feedResult.data || [];
    const totalCount = feedResult.count ?? 0;

    // Batch: obtener likes y reacciones del usuario en 2 queries totales (en vez de 2 por post)
    const checkinIds = paginatedCheckins.map((c: any) => c.checkin_id);

    const [likesResult, reactionsResult] = await Promise.all([
      supabase
        .from("challenge_checkin_likes")
        .select("checkin_id")
        .in("checkin_id", checkinIds)
        .eq("user_id", user.id),
      supabase
        .from("post_reactions")
        .select("checkin_id, reaction_type")
        .in("checkin_id", checkinIds)
        .eq("user_id", user.id),
    ]);

    const likedSet = new Set(likesResult.data?.map((l) => l.checkin_id) ?? []);
    const reactionsMap = new Map(
      reactionsResult.data?.map((r) => [r.checkin_id, r.reaction_type]) ?? []
    );

    const dataWithLikeStatus = paginatedCheckins.map((checkin: any) => ({
      ...checkin,
      isLikedByCurrentUser: likedSet.has(checkin.checkin_id),
      userReaction: reactionsMap.get(checkin.checkin_id) || null,
    }));

    return NextResponse.json({
      data: dataWithLikeStatus,
      count: totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error("Error in social feed API:", error);
    return NextResponse.json(
      { error: "Error al obtener el feed" },
      { status: 500 }
    );
  }
}
