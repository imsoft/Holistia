import { createClientForRequest } from "@/utils/supabase/api-auth";
import { NextResponse } from "next/server";
import { updateAppointmentStatusInGoogleCalendar } from "@/actions/google-calendar";

/**
 * Marca una cita como realizada (completed).
 * Solo el profesional asignado a la cita puede realizar esta acción.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClientForRequest(request);
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId es requerido" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, professional_id, status, appointment_date, appointment_time")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    const { data: professionalApp } = await supabase
      .from("professional_applications")
      .select("id, user_id")
      .eq("id", appointment.professional_id)
      .single();

    if (!professionalApp || professionalApp.user_id !== user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para marcar esta cita" },
        { status: 403 }
      );
    }

    const allowedStatuses = ["confirmed", "pending", "paid"];
    if (!allowedStatuses.includes(appointment.status)) {
      return NextResponse.json(
        {
          error:
            "Solo se pueden marcar como realizadas citas confirmadas o pendientes",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      return NextResponse.json(
        { error: "Error al marcar la cita como realizada" },
        { status: 500 }
      );
    }

    // Actualizar estado en Google Calendar (non-blocking)
    try {
      if (professionalApp.user_id) {
        await updateAppointmentStatusInGoogleCalendar(appointmentId, professionalApp.user_id, 'completed');
      }
    } catch (calendarError) {
      console.error('Error updating Google Calendar event:', calendarError);
    }

    return NextResponse.json({
      success: true,
      message: "Cita marcada como realizada",
    });
  } catch (error) {
    console.error("Error in mark-completed:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
