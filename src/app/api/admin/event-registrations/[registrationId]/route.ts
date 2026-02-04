import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { notifyFirstWaitlistUser } from "@/lib/event-waitlist";

/**
 * PATCH: Actualizar estado de una inscripción (solo admin).
 * Si status === 'cancelled', se notifica al primero de la lista de espera si existe.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await context.params;
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId es requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single();

    if (profile?.type !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden modificar inscripciones" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { status } = body as { status?: string };
    if (status !== "cancelled") {
      return NextResponse.json(
        { error: "Solo se permite cancelar (status: cancelled)" },
        { status: 400 }
      );
    }

    const { data: registration, error: fetchError } = await supabase
      .from("event_registrations")
      .select("id, event_id, status")
      .eq("id", registrationId)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    if (registration.status === "cancelled") {
      return NextResponse.json({ message: "La inscripción ya estaba cancelada" });
    }

    const { error: updateError } = await supabase
      .from("event_registrations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", registrationId);

    if (updateError) {
      console.error("Error cancelling registration:", updateError);
      return NextResponse.json(
        { error: "Error al cancelar la inscripción" },
        { status: 500 }
      );
    }

    await notifyFirstWaitlistUser(supabase, registration.event_id);

    return NextResponse.json({
      success: true,
      message: "Inscripción cancelada. Si había lista de espera, se ha notificado al primero.",
    });
  } catch (error) {
    console.error("Error in PATCH event registration:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
