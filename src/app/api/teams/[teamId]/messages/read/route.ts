import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// POST - Marcar mensaje(s) como leído(s)
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
    const { messageIds } = body; // Array de IDs de mensajes

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "messageIds debe ser un array no vacío" },
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

    // Marcar mensajes como leídos (insertar solo si no existen)
    const reads = messageIds.map((messageId: string) => ({
      message_id: messageId,
      user_id: user.id,
    }));

    const { error: insertError } = await supabase
      .from("team_message_reads")
      .upsert(reads, {
        onConflict: "message_id,user_id",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Error al marcar mensajes como leídos" },
      { status: 500 }
    );
  }
}

// GET - Obtener conteo de mensajes no leídos del equipo
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

    // Obtener el conteo de mensajes no leídos
    const { data: unreadData } = await supabase
      .from("team_unread_messages")
      .select("unread_count, last_message_at")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      data: {
        unreadCount: unreadData?.unread_count || 0,
        lastMessageAt: unreadData?.last_message_at || null,
      },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Error al obtener mensajes no leídos" },
      { status: 500 }
    );
  }
}
