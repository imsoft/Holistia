import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener mensajes del chat del equipo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // ID del mensaje para paginación

    // Verificar que el usuario es miembro del equipo
    const { data: membership } = await supabase
      .from("challenge_team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    // Construir query para mensajes
    let query = supabase
      .from("team_chat_messages")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Paginación: obtener mensajes anteriores al ID especificado
    if (before) {
      const { data: beforeMessage } = await supabase
        .from("team_messages")
        .select("created_at")
        .eq("id", before)
        .single();

      if (beforeMessage) {
        query = query.lt("created_at", beforeMessage.created_at);
      }
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    // Invertir el orden para que los más recientes estén al final
    const sortedMessages = (messages || []).reverse();

    // Obtener las reacciones del usuario actual para cada mensaje
    const messageIds = sortedMessages.map((m: any) => m.id);
    const { data: userReactions } = await supabase
      .from("team_message_reactions")
      .select("message_id, emoji")
      .in("message_id", messageIds)
      .eq("user_id", user.id);

    // Mapear reacciones del usuario
    const userReactionsMap = new Map(
      (userReactions || []).map((r: any) => [r.message_id, r.emoji])
    );

    // Enriquecer mensajes con info de reacción del usuario
    const enrichedMessages = sortedMessages.map((message: any) => ({
      ...message,
      user_reaction: userReactionsMap.get(message.id) || null,
    }));

    return NextResponse.json({
      data: enrichedMessages,
      hasMore: (messages || []).length === limit,
    });
  } catch (error) {
    console.error("Error fetching team messages:", error);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }
}

// POST - Enviar un nuevo mensaje
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

    const { teamId } = await params;
    const body = await request.json();
    const { content, messageType = "user_message", replyToId, metadata } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es miembro del equipo
    const { data: membership } = await supabase
      .from("challenge_team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    // Crear el mensaje
    const { data: message, error: messageError } = await supabase
      .from("team_messages")
      .insert({
        team_id: teamId,
        sender_id: user.id,
        message_type: messageType,
        content: content.trim(),
        reply_to_id: replyToId || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    // Obtener el mensaje completo con info del remitente
    const { data: fullMessage } = await supabase
      .from("team_chat_messages")
      .select("*")
      .eq("id", message.id)
      .single();

    return NextResponse.json({ data: fullMessage }, { status: 201 });
  } catch (error) {
    console.error("Error sending team message:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje" },
      { status: 500 }
    );
  }
}

// PATCH - Editar un mensaje
export async function PATCH(
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
    const { messageId, content } = body;

    if (!messageId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Actualizar el mensaje (RLS asegura que solo el propietario puede editar)
    const { data: message, error: updateError } = await supabase
      .from("team_messages")
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .eq("sender_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado o no tienes permiso para editarlo" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: message });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Error al editar mensaje" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un mensaje
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

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId es requerido" },
        { status: 400 }
      );
    }

    // Eliminar el mensaje (RLS asegura que solo el propietario puede eliminar)
    const { error: deleteError } = await supabase
      .from("team_messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Error al eliminar mensaje" },
      { status: 500 }
    );
  }
}
