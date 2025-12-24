import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const VALID_REACTIONS = ['like', 'love', 'fire', 'strong', 'clap', 'wow'] as const;
type ReactionType = typeof VALID_REACTIONS[number];

// POST - Agregar o cambiar reacción a un post
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { checkinId, reactionType } = body;

    if (!checkinId || !reactionType) {
      return NextResponse.json(
        { error: "checkinId y reactionType son requeridos" },
        { status: 400 }
      );
    }

    if (!VALID_REACTIONS.includes(reactionType as ReactionType)) {
      return NextResponse.json(
        { error: "Tipo de reacción inválido" },
        { status: 400 }
      );
    }

    // Insertar o actualizar la reacción (upsert)
    const { data: reaction, error: reactionError } = await supabase
      .from("post_reactions")
      .upsert(
        {
          checkin_id: checkinId,
          user_id: user.id,
          reaction_type: reactionType,
        },
        {
          onConflict: "checkin_id,user_id",
        }
      )
      .select()
      .single();

    if (reactionError) {
      return NextResponse.json({ error: reactionError.message }, { status: 500 });
    }

    return NextResponse.json({ data: reaction });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Error al agregar reacción" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar reacción de un post
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkinId = searchParams.get("checkinId");

    if (!checkinId) {
      return NextResponse.json(
        { error: "checkinId es requerido" },
        { status: 400 }
      );
    }

    // Eliminar la reacción
    const { error: deleteError } = await supabase
      .from("post_reactions")
      .delete()
      .eq("checkin_id", checkinId)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json(
      { error: "Error al quitar reacción" },
      { status: 500 }
    );
  }
}

// GET - Obtener reacciones de un post
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const checkinId = searchParams.get("checkinId");

    if (!checkinId) {
      return NextResponse.json(
        { error: "checkinId es requerido" },
        { status: 400 }
      );
    }

    // Obtener todas las reacciones del post
    const { data: reactions, error: reactionsError } = await supabase
      .from("post_reactions")
      .select(`
        id,
        reaction_type,
        created_at,
        user_id,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("checkin_id", checkinId)
      .order("created_at", { ascending: false });

    if (reactionsError) {
      return NextResponse.json({ error: reactionsError.message }, { status: 500 });
    }

    // Agrupar por tipo de reacción
    const groupedReactions = reactions?.reduce((acc: any, reaction: any) => {
      const type = reaction.reaction_type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          users: [],
        };
      }
      acc[type].count++;
      acc[type].users.push({
        id: reaction.user_id,
        firstName: reaction.profiles?.first_name,
        lastName: reaction.profiles?.last_name,
        avatarUrl: reaction.profiles?.avatar_url,
      });
      return acc;
    }, {});

    // Verificar si el usuario actual ha reaccionado
    const userReaction = user
      ? reactions?.find((r: any) => r.user_id === user.id)?.reaction_type
      : null;

    return NextResponse.json({
      data: {
        reactions: groupedReactions || {},
        userReaction,
        totalCount: reactions?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Error al obtener reacciones" },
      { status: 500 }
    );
  }
}
