import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST: Apuntarse a la lista de espera del evento.
 * Solo si el evento está lleno, el usuario está autenticado, no está ya inscrito y no está en la lista.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    if (!eventId) {
      return NextResponse.json({ error: "eventId es requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Debes iniciar sesión para apuntarte a la lista de espera" }, { status: 401 });
    }

    const { data: event, error: eventError } = await supabase
      .from("events_workshops")
      .select("id, name, max_capacity, is_active")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento no encontrado o no disponible" }, { status: 404 });
    }

    const { count: confirmedCount, error: countError } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "confirmed");

    if (countError || confirmedCount == null) {
      return NextResponse.json({ error: "Error al verificar cupos" }, { status: 500 });
    }

    const isFull = confirmedCount >= event.max_capacity;
    if (!isFull) {
      return NextResponse.json(
        { error: "El evento aún tiene cupos. Puedes inscribirte directamente." },
        { status: 400 }
      );
    }

    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRegistration && ["confirmed", "pending"].includes(existingRegistration.status)) {
      return NextResponse.json(
        { error: "Ya estás inscrito o con registro pendiente en este evento" },
        { status: 400 }
      );
    }

    const { data: existingWaitlist } = await supabase
      .from("event_waitlist")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingWaitlist) {
      return NextResponse.json(
        { error: "Ya estás en la lista de espera de este evento" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from("event_waitlist").insert({
      event_id: eventId,
      user_id: user.id,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Ya estás en la lista de espera de este evento" },
          { status: 400 }
        );
      }
      console.error("Error inserting waitlist:", insertError);
      return NextResponse.json(
        { error: "Error al apuntarte a la lista de espera" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Te hemos añadido a la lista de espera. Te avisaremos si se libera un cupo.",
    });
  } catch (error) {
    console.error("Error in waitlist POST:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
