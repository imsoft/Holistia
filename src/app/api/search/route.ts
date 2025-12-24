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
    const type = searchParams.get("type") || "all"; // all, users, challenges, teams, posts

    if (!query || query.length < 2) {
      return NextResponse.json({
        data: {
          users: [],
          challenges: [],
          teams: [],
          posts: [],
        },
      });
    }

    const searchQuery = query.toLowerCase();
    const results: any = {
      users: [],
      challenges: [],
      teams: [],
      posts: [],
    };

    // Buscar usuarios
    if (type === "all" || type === "users") {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(5);

      results.users = users || [];
    }

    // Buscar retos
    if (type === "all" || type === "challenges") {
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, title, description, cover_image, category, difficulty, duration_days, creator_id")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(5);

      results.challenges = challenges || [];
    }

    // Buscar equipos
    if (type === "all" || type === "teams") {
      const { data: teams } = await supabase
        .from("challenge_teams")
        .select(`
          id,
          team_name,
          challenge_id,
          creator_id,
          max_members,
          is_full,
          challenges (
            title,
            cover_image
          )
        `)
        .ilike("team_name", `%${searchQuery}%`)
        .limit(5);

      // Agregar conteo de miembros
      if (teams) {
        results.teams = await Promise.all(
          teams.map(async (team: any) => {
            const { count } = await supabase
              .from("challenge_team_members")
              .select("*", { count: "exact", head: true })
              .eq("team_id", team.id);

            return {
              ...team,
              member_count: count || 0,
            };
          })
        );
      }
    }

    // Buscar publicaciones
    if (type === "all" || type === "posts") {
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
