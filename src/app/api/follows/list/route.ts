import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export type FollowUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  username: string | null;
  type: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const type = searchParams.get("type"); // "followers" | "following"

    if (!user_id || !type) {
      return NextResponse.json(
        { error: "Faltan user_id o type (followers | following)" },
        { status: 400 }
      );
    }

    if (type !== "followers" && type !== "following") {
      return NextResponse.json(
        { error: "type debe ser 'followers' o 'following'" },
        { status: 400 }
      );
    }

    if (type === "followers") {
      // Usuarios que siguen a user_id → follower_id es quien sigue, following_id es user_id
      const { data: rows, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user_id);

      if (error) {
        console.error("Error fetching followers:", error);
        return NextResponse.json(
          { error: "Error al obtener seguidores" },
          { status: 500 }
        );
      }

      const ids = [...new Set((rows || []).map((r) => r.follower_id).filter(Boolean))];
      if (ids.length === 0) {
        return NextResponse.json({ users: [] });
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, username, type")
        .in("id", ids);

      if (profilesError) {
        console.error("Error fetching follower profiles:", profilesError);
        return NextResponse.json(
          { error: "Error al obtener perfiles" },
          { status: 500 }
        );
      }

      // Para profesionales, usar foto de perfil profesional (professional_applications.profile_photo)
      const professionalIds = (profiles || []).filter((p) => p.type === "professional").map((p) => p.id);
      let professionalPhotoMap = new Map<string, string>();
      if (professionalIds.length > 0) {
        const { data: proApps } = await supabase
          .from("professional_applications")
          .select("user_id, profile_photo")
          .in("user_id", professionalIds);
        (proApps || []).forEach((pa) => {
          if (pa.profile_photo) professionalPhotoMap.set(pa.user_id, pa.profile_photo);
        });
      }

      const users: FollowUser[] = (profiles || []).map((p) => ({
        id: p.id,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        avatar_url: professionalPhotoMap.get(p.id) ?? p.avatar_url ?? null,
        username: p.username ?? null,
        type: p.type ?? null,
      }));

      return NextResponse.json({ users });
    }

    // type === "following": usuarios que user_id sigue
    const { data: rows, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user_id);

    if (error) {
      console.error("Error fetching following:", error);
      return NextResponse.json(
        { error: "Error al obtener seguidos" },
        { status: 500 }
      );
    }

    const ids = [...new Set((rows || []).map((r) => r.following_id).filter(Boolean))];
    if (ids.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, username, type")
      .in("id", ids);

    if (profilesError) {
      console.error("Error fetching following profiles:", profilesError);
      return NextResponse.json(
        { error: "Error al obtener perfiles" },
        { status: 500 }
      );
    }

    // Para profesionales, usar foto de perfil profesional (professional_applications.profile_photo)
    const professionalIds = (profiles || []).filter((p) => p.type === "professional").map((p) => p.id);
    let professionalPhotoMap = new Map<string, string>();
    if (professionalIds.length > 0) {
      const { data: proApps } = await supabase
        .from("professional_applications")
        .select("user_id, profile_photo")
        .in("user_id", professionalIds);
      (proApps || []).forEach((pa) => {
        if (pa.profile_photo) professionalPhotoMap.set(pa.user_id, pa.profile_photo);
      });
    }

    const users: FollowUser[] = (profiles || []).map((p) => ({
      id: p.id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      avatar_url: professionalPhotoMap.get(p.id) ?? p.avatar_url ?? null,
      username: p.username ?? null,
      type: p.type ?? null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in follows list endpoint:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
