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

    // Construir query base
    let query = supabase
      .from("notifications")
      .select(`
        *,
        related_user:profiles!notifications_related_user_id_fkey(
          first_name,
          last_name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    // Aplicar paginación
    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("❌ Error fetching notifications:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Si es un error de relación, intentar sin la relación
      if (error.code === "42P01" || error.message?.includes("not found") || error.message?.includes("does not exist")) {
        console.log("⚠️ Retrying without related_user join...");
        let fallbackQuery = supabase
          .from("notifications")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false});
        
        if (unreadOnly) {
          fallbackQuery = fallbackQuery.eq("is_read", false);
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery
          .range(offset, offset + limit - 1);
        
        if (fallbackError) {
          return NextResponse.json({ 
            error: "Error al obtener notificaciones",
            details: fallbackError.message 
          }, { status: 500 });
        }
        
        // Transformar sin related_user
        const transformedData = (fallbackData || []).map((notification: any) => ({
          ...notification,
          related_user_first_name: null,
          related_user_last_name: null,
          related_user_avatar: null,
        }));

        // Obtener conteo de no leídas
        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        return NextResponse.json({
          data: transformedData || [],
          count: count || 0,
          unreadCount: unreadCount || 0,
          hasMore: (transformedData?.length || 0) === limit,
        });
      }
      
      return NextResponse.json({ 
        error: "Error al obtener notificaciones",
        details: error.message 
      }, { status: 500 });
    }

    // Transformar datos para incluir información del usuario relacionado
    const transformedData = (data || []).map((notification: any) => ({
      ...notification,
      related_user_first_name: notification.related_user?.first_name || null,
      related_user_last_name: notification.related_user?.last_name || null,
      related_user_avatar: notification.related_user?.avatar_url || null,
    }));

    // Obtener conteo de no leídas
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    
    if (countError) {
      console.error("❌ Error counting unread notifications:", countError);
      // No fallar si el count falla, solo loguear
    }

    return NextResponse.json({
      data: transformedData || [],
      count: count || 0,
      unreadCount: unreadCount || 0,
      hasMore: (transformedData?.length || 0) === limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
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
