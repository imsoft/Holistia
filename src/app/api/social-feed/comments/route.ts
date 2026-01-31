import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const checkinId = searchParams.get("checkinId");

    if (!checkinId) {
      return NextResponse.json({ error: "checkinId es requerido" }, { status: 400 });
    }

    // Obtener comentarios (sin join a profiles - no hay FK directa)
    const { data: comments, error } = await supabase
      .from("challenge_checkin_comments")
      .select("id, comment_text, created_at, updated_at, user_id")
      .eq("checkin_id", checkinId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener perfiles por separado
    const userIds = [...new Set((comments || []).map((c) => c.user_id).filter(Boolean))];
    let profilesMap = new Map<string, { first_name: string | null; last_name: string | null; photo_url: string | null }>();
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, photo_url")
        .in("id", userIds);
      (profilesData || []).forEach((p) => {
        profilesMap.set(p.id, {
          first_name: p.first_name ?? null,
          last_name: p.last_name ?? null,
          photo_url: p.photo_url ?? null,
        });
      });
    }

    const dataWithProfiles = (comments || []).map((comment) => {
      const profile = profilesMap.get(comment.user_id);
      return {
        ...comment,
        profiles: profile
          ? { first_name: profile.first_name, last_name: profile.last_name, photo_url: profile.photo_url }
          : { first_name: null, last_name: null, photo_url: null },
      };
    });

    return NextResponse.json({ data: dataWithProfiles });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { checkinId, commentText } = await request.json();

    if (!checkinId || !commentText || commentText.trim() === "") {
      return NextResponse.json(
        { error: "checkinId y commentText son requeridos" },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que el check-in existe, es público y permite comentarios
    const { data: checkin } = await supabase
      .from("challenge_checkins")
      .select("id, is_public, allow_comments")
      .eq("id", checkinId)
      .single();

    if (!checkin || !checkin.is_public || !checkin.allow_comments) {
      return NextResponse.json(
        { error: "Check-in no encontrado o no permite comentarios" },
        { status: 404 }
      );
    }

    // Crear comentario
    const { data: newComment, error: commentError } = await supabase
      .from("challenge_checkin_comments")
      .insert({
        checkin_id: checkinId,
        user_id: user.id,
        comment_text: commentText.trim(),
      })
      .select("id, comment_text, created_at, updated_at, user_id")
      .single();

    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }

    // Obtener perfil del autor por separado
    let profile = { first_name: null as string | null, last_name: null as string | null, photo_url: null as string | null };
    if (newComment?.user_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, photo_url")
        .eq("id", newComment.user_id)
        .single();
      if (profileData) {
        profile = {
          first_name: profileData.first_name ?? null,
          last_name: profileData.last_name ?? null,
          photo_url: profileData.photo_url ?? null,
        };
      }
    }

    return NextResponse.json({
      data: { ...newComment, profiles: profile },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Error al crear comentario" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId es requerido" }, { status: 400 });
    }

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Eliminar comentario (RLS se encarga de verificar que sea del usuario)
    const { error: deleteError } = await supabase
      .from("challenge_checkin_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Error al eliminar comentario" }, { status: 500 });
  }
}
