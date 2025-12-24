import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// POST - Agregar reacción a un mensaje
export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, emoji } = body;

    const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💪'];

    if (!messageId || !emoji || !validEmojis.includes(emoji)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Insertar o actualizar la reacción (constraint único evita duplicados)
    const { data: reaction, error: reactionError } = await supabase
      .from("team_message_reactions")
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      })
      .select()
      .single();

    if (reactionError) {
      // Si ya existe, es porque el usuario ya reaccionó con ese emoji
      if (reactionError.code === "23505") {
        return NextResponse.json(
          { error: "Ya reaccionaste con este emoji" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: reactionError.message }, { status: 500 });
    }

    return NextResponse.json({ data: reaction }, { status: 201 });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Error al agregar reacción" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar reacción de un mensaje
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    const emoji = searchParams.get("emoji");

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: "messageId y emoji son requeridos" },
        { status: 400 }
      );
    }

    // Eliminar la reacción
    const { error: deleteError } = await supabase
      .from("team_message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

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
