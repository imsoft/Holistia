import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** GET: listar feedback del evento (organizador o admin) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: event } = await supabase
      .from("events_workshops")
      .select("id, professional_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.type === "admin";

    let isOrganizer = false;
    if (event.professional_id) {
      const { data: prof } = await supabase
        .from("professional_applications")
        .select("user_id")
        .eq("id", event.professional_id)
        .single();
      isOrganizer = prof?.user_id === user.id;
    }

    if (!isAdmin && !isOrganizer) {
      return NextResponse.json(
        { error: "No tienes permiso para ver el feedback de este evento" },
        { status: 403 }
      );
    }

    const { data: feedbackList, error: feedbackError } = await supabase
      .from("event_feedback")
      .select("id, event_registration_id, user_id, rating, comment, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error("Error fetching event feedback:", feedbackError);
      return NextResponse.json(
        { error: "Error al cargar el feedback" },
        { status: 500 }
      );
    }

    const userIds = [...new Set((feedbackList || []).map((f: any) => f.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const items = (feedbackList || []).map((f: any) => {
      const p = profileMap.get(f.user_id);
      const name = p
        ? [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Participante"
        : "Participante";
      return {
        id: f.id,
        event_registration_id: f.event_registration_id,
        user_id: f.user_id,
        participant_name: name,
        rating: f.rating,
        comment: f.comment ?? null,
        created_at: f.created_at,
      };
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Error in GET event feedback:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/** POST: enviar feedback (participante con inscripción confirmada, evento pasado) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { event_registration_id, rating, comment } = body;

    if (
      !event_registration_id ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "event_registration_id y rating (1-5) son requeridos" },
        { status: 400 }
      );
    }

    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select("id, event_id, user_id, status")
      .eq("id", event_registration_id)
      .eq("event_id", eventId)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    if (registration.user_id !== user.id) {
      return NextResponse.json(
        { error: "No puedes enviar feedback por esta inscripción" },
        { status: 403 }
      );
    }

    if (registration.status !== "confirmed") {
      return NextResponse.json(
        { error: "Solo puedes dejar feedback con una inscripción confirmada" },
        { status: 400 }
      );
    }

    const { data: event } = await supabase
      .from("events_workshops")
      .select("event_date")
      .eq("id", eventId)
      .single();

    if (event?.event_date) {
      const [y, m, d] = event.event_date.split("-").map(Number);
      const eventDate = new Date(y, m - 1, d);
      eventDate.setHours(23, 59, 59, 999);
      if (new Date() < eventDate) {
        return NextResponse.json(
          { error: "Solo puedes dejar feedback después del evento" },
          { status: 400 }
        );
      }
    }

    const { data: existing } = await supabase
      .from("event_feedback")
      .select("id")
      .eq("event_registration_id", event_registration_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya enviaste feedback para este evento" },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("event_feedback")
      .insert({
        event_id: eventId,
        event_registration_id,
        user_id: user.id,
        rating,
        comment: typeof comment === "string" ? comment.trim() || null : null,
      })
      .select("id, rating, comment, created_at")
      .single();

    if (insertError) {
      console.error("Error inserting event feedback:", insertError);
      return NextResponse.json(
        { error: "Error al guardar el feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: inserted });
  } catch (error) {
    console.error("Error in POST event feedback:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
