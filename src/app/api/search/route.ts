import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // all, users, challenges, posts

    if (!query || query.length < 2) {
      return NextResponse.json({
        data: {
          users: [],
          challenges: [],
          posts: [],
        },
      });
    }

    const searchQuery = query.toLowerCase();

    // Cuando type="all", ejecutar las 3 queries en paralelo
    if (type === "all") {
      const [usersResult, challengesResult, postsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, role")
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
          .limit(5),
        supabase
          .from("challenges")
          .select("id, title, description, cover_image, category, difficulty, duration_days, creator_id")
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq("is_active", true)
          .limit(5),
        supabase
          .from("social_feed_checkins")
          .select("*")
          .or(`notes.ilike.%${searchQuery}%,challenge_title.ilike.%${searchQuery}%`)
          .order("checkin_time", { ascending: false })
          .limit(5),
      ]);

      return NextResponse.json({
        data: {
          users: usersResult.data || [],
          challenges: challengesResult.data || [],
          posts: postsResult.data || [],
        },
      });
    }

    // Para búsquedas de un solo tipo, ejecutar solo la query necesaria
    const results: { users: unknown[]; challenges: unknown[]; posts: unknown[] } = {
      users: [],
      challenges: [],
      posts: [],
    };

    if (type === "users") {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(5);
      results.users = users || [];
    } else if (type === "challenges") {
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, title, description, cover_image, category, difficulty, duration_days, creator_id")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(5);
      results.challenges = challenges || [];
    } else if (type === "posts") {
      const { data: posts } = await supabase
        .from("social_feed_checkins")
        .select("*")
        .or(`notes.ilike.%${searchQuery}%,challenge_title.ilike.%${searchQuery}%`)
        .order("checkin_time", { ascending: false })
        .limit(5);
      results.posts = posts || [];
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { error: "Error al realizar la búsqueda" },
      { status: 500 }
    );
  }
}
