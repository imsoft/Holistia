import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener notificaciones del usuario
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Query base (sin joins a FK por nombre: evita 500 en producción si cambia el constraint)
    let baseQuery = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (unreadOnly) baseQuery = baseQuery.eq("is_read", false);

    // Ejecutar notificaciones + conteo de no leídas en paralelo (son independientes)
    const [notificationsResult, unreadResult] = await Promise.all([
      baseQuery.range(offset, offset + limit - 1),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

    const { data, error, count } = notificationsResult;
    const { count: unreadCount, error: countError } = unreadResult;

    if (error) {
      console.error("❌ Error fetching notifications:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // No romper UI: responder OK con lista vacía
      return NextResponse.json({
        data: [],
        count: 0,
        unreadCount: 0,
        hasMore: false,
      });
    }

    if (countError) {
      console.error("❌ Error counting unread notifications:", countError);
    }

    const notifications = (data || []) as any[];

    // Resolver perfiles relacionados (si existen) por `related_user_id`
    const relatedUserIds = Array.from(
      new Set(
        notifications
          .map((n) => n.related_user_id)
          .filter((id) => typeof id === "string" && id.length > 0)
      )
    );

    let profilesMap = new Map<string, { first_name: string | null; last_name: string | null; avatar_url: string | null }>();

    if (relatedUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", relatedUserIds);

      if (profilesError) {
        console.error("⚠️ Error fetching related profiles:", profilesError);
      } else {
        profilesMap = new Map(
          (profiles || []).map((p: any) => [
            p.id,
            {
              first_name: p.first_name ?? null,
              last_name: p.last_name ?? null,
              avatar_url: p.avatar_url ?? null,
            },
          ])
        );
      }
    }

    const transformedData = notifications.map((n) => {
      const related = n.related_user_id ? profilesMap.get(n.related_user_id) : undefined;
      return {
        ...n,
        related_user_first_name: related?.first_name ?? null,
        related_user_last_name: related?.last_name ?? null,
        related_user_avatar: related?.avatar_url ?? null,
      };
    });

    return NextResponse.json({
      data: transformedData || [],
      count: count || 0,
      unreadCount: unreadCount || 0,
      hasMore: (transformedData?.length || 0) === limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // No romper UI: responder OK con lista vacía
    return NextResponse.json({
      data: [],
      count: 0,
      unreadCount: 0,
      hasMore: false,
    });
  }
}

// PATCH - Marcar notificaciones como leídas
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { notificationIds, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Marcar todas como leídas
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Todas marcadas como leídas" });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds debe ser un array" },
        { status: 400 }
      );
    }

    // Marcar específicas como leídas
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", notificationIds)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificaciones" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificaciones
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId es requerido" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Error al eliminar notificación" },
      { status: 500 }
    );
  }
}
