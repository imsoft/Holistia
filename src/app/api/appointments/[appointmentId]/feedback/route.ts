import { createClientForRequest } from "@/utils/supabase/api-auth";
import { NextRequest, NextResponse } from "next/server";

/** POST: enviar feedback post-cita ("¿Todo bien con tu reserva?") */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const supabase = await createClientForRequest(request);
    const { appointmentId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { rating, comment } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 3) {
      return NextResponse.json(
        { error: "rating es requerido y debe ser 1 (Todo bien), 2 (Más o menos) o 3 (No)" },
        { status: 400 }
      );
    }

    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .select("id, patient_id, status, appointment_date, appointment_time")
      .eq("id", appointmentId)
      .single();

    if (aptError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    if (appointment.patient_id !== user.id) {
      return NextResponse.json(
        { error: "No puedes enviar feedback por esta cita" },
        { status: 403 }
      );
    }

    if (appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Solo puedes dejar feedback para citas ya realizadas" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("appointment_feedback")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya enviaste feedback para esta cita" },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("appointment_feedback")
      .insert({
        appointment_id: appointmentId,
        patient_id: user.id,
        rating,
        comment: typeof comment === "string" ? comment.trim() || null : null,
      })
      .select("id, rating, comment, created_at")
      .single();

    if (insertError) {
      console.error("Error inserting appointment feedback:", insertError);
      return NextResponse.json(
        { error: "Error al guardar el feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: inserted });
  } catch (error) {
    console.error("Error in POST appointment feedback:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
