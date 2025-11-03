import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, newDate, newTime, rescheduledBy } = body;

    if (!appointmentId || !newDate || !newTime || !rescheduledBy) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Obtener la cita actual con datos del profesional y paciente
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        professional:professional_applications!professional_id (
          id,
          first_name,
          last_name,
          email,
          user_id
        ),
        patient:profiles!patient_id (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el paciente o el profesional
    const isProfessional = appointment.professional.user_id === user.id;
    const isPatient = appointment.patient_id === user.id;

    if (!isProfessional && !isPatient) {
      return NextResponse.json(
        { error: "No tienes permiso para reprogramar esta cita" },
        { status: 403 }
      );
    }

    // Verificar que la cita no esté cancelada o completada
    if (["cancelled", "completed", "patient_no_show", "professional_no_show"].includes(appointment.status)) {
      return NextResponse.json(
        { error: `No se puede reprogramar una cita con estado: ${appointment.status}` },
        { status: 400 }
      );
    }

    // Guardar fecha y hora anterior
    const oldDate = appointment.appointment_date;
    const oldTime = appointment.appointment_time;

    // Actualizar la cita
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        appointment_date: newDate,
        appointment_time: newTime,
        updated_at: new Date().toISOString(),
        // Opcional: agregar campo para tracking de reprogramación
        // rescheduled_at: new Date().toISOString(),
        // rescheduled_by: rescheduledBy,
      })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error al actualizar cita:", updateError);
      return NextResponse.json(
        { error: "Error al reprogramar la cita" },
        { status: 500 }
      );
    }

    // Preparar datos para los emails
    const professionalName = `${appointment.professional.first_name} ${appointment.professional.last_name}`;
    const patientName = `${appointment.patient.first_name} ${appointment.patient.last_name}`;

    // Formatear fechas
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const appointmentType =
      appointment.appointment_type === "online" ? "En línea" : "Presencial";
    const location =
      appointment.appointment_type === "online"
        ? "En línea (Se enviará enlace)"
        : appointment.location || "Por confirmar";

    // Leer template de email
    const templatePath = path.join(
      process.cwd(),
      "database",
      "email-templates",
      "appointment-rescheduled.html"
    );
    const emailTemplate = fs.readFileSync(templatePath, "utf-8");

    // Enviar email al paciente
    const patientEmailData = {
      recipient_name: patientName,
      other_party_name: professionalName,
      rescheduled_by: rescheduledBy === "professional" ? "el profesional" : "ti (paciente)",
      professional_name: professionalName,
      old_date: formatDate(oldDate),
      old_time: oldTime,
      new_date: formatDate(newDate),
      new_time: newTime,
      duration_minutes: appointment.duration_minutes,
      appointment_type: appointmentType,
      location,
      cost: appointment.cost,
      notes: appointment.notes || "",
      contact_name: professionalName,
    };

    let patientEmail = emailTemplate;
    Object.entries(patientEmailData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      patientEmail = patientEmail.replace(regex, value.toString());
    });

    // Enviar email al profesional
    const professionalEmailData = {
      recipient_name: professionalName,
      other_party_name: patientName,
      rescheduled_by: rescheduledBy === "patient" ? "el paciente" : "ti (profesional)",
      professional_name: professionalName,
      old_date: formatDate(oldDate),
      old_time: oldTime,
      new_date: formatDate(newDate),
      new_time: newTime,
      duration_minutes: appointment.duration_minutes,
      appointment_type: appointmentType,
      location,
      cost: appointment.cost,
      notes: appointment.notes || "",
      contact_name: patientName,
    };

    let professionalEmail = emailTemplate;
    Object.entries(professionalEmailData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      professionalEmail = professionalEmail.replace(regex, value.toString());
    });

    // Enviar emails usando Resend
    try {
      await Promise.all([
        resend.emails.send({
          from: "Holistia <noreply@holistia.io>",
          to: appointment.patient.email,
          subject: "Cita Reprogramada - Holistia",
          html: patientEmail,
        }),
        resend.emails.send({
          from: "Holistia <noreply@holistia.io>",
          to: appointment.professional.email,
          subject: "Cita Reprogramada - Holistia",
          html: professionalEmail,
        }),
      ]);

      console.log("Emails de reprogramación enviados exitosamente");
    } catch (emailError) {
      console.error("Error al enviar emails:", emailError);
      // No fallar la operación si los emails no se envían
    }

    return NextResponse.json({
      success: true,
      message: "Cita reprogramada exitosamente",
      appointment: {
        id: appointmentId,
        old_date: oldDate,
        old_time: oldTime,
        new_date: newDate,
        new_time: newTime,
      },
    });
  } catch (error) {
    console.error("Error en reschedule endpoint:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
