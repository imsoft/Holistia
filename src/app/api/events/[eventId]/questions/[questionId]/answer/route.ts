import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST - Responder una pregunta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; questionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId, questionId } = await params;

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { answer } = body;

    if (!answer || !answer.trim()) {
      return NextResponse.json(
        { error: "La respuesta no puede estar vacía" },
        { status: 400 }
      );
    }

    // Verificar que la pregunta existe y pertenece al evento
    const { data: question, error: questionError } = await supabase
      .from("event_questions")
      .select("id, event_id")
      .eq("id", questionId)
      .eq("event_id", eventId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene permisos para responder
    // (admin o profesional del evento)
    const { data: profile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.type === "admin";

    // Verificar si es el profesional del evento
    const { data: event } = await supabase
      .from("events_workshops")
      .select("professional_id")
      .eq("id", eventId)
      .single();

    let isProfessional = false;
    if (event?.professional_id) {
      const { data: professional } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("id", event.professional_id)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      isProfessional = !!professional;
    }

    if (!isAdmin && !isProfessional) {
      return NextResponse.json(
        { error: "No tienes permisos para responder esta pregunta" },
        { status: 403 }
      );
    }

    // Verificar si ya existe una respuesta
    const { data: existingAnswer } = await supabase
      .from("event_question_answers")
      .select("id")
      .eq("question_id", questionId)
      .maybeSingle();

    if (existingAnswer) {
      // Actualizar respuesta existente
      const { data: updatedAnswer, error: updateError } = await supabase
        .from("event_question_answers")
        .update({
          answer: answer.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAnswer.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Error updating answer:", updateError);
        return NextResponse.json(
          { error: "Error al actualizar la respuesta" },
          { status: 500 }
        );
      }

      // Obtener perfil del usuario que respondió por separado
      const { data: answeredByProfile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("id", updatedAnswer.answered_by_user_id)
        .maybeSingle();

      // Combinar datos
      const answerWithProfile = {
        ...updatedAnswer,
        answered_by: answeredByProfile || {
          id: updatedAnswer.answered_by_user_id,
          first_name: "Usuario",
          last_name: "",
          avatar_url: null,
        },
      };

      return NextResponse.json({ answer: answerWithProfile }, { status: 200 });
    } else {
      // Crear nueva respuesta
      const { data: newAnswer, error: createError } = await supabase
        .from("event_question_answers")
        .insert({
          question_id: questionId,
          answered_by_user_id: user.id,
          answer: answer.trim(),
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Error creating answer:", createError);
        return NextResponse.json(
          { error: "Error al crear la respuesta" },
          { status: 500 }
        );
      }

      // Obtener perfil del usuario que respondió por separado
      const { data: answeredByProfile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      // Combinar datos
      const answerWithProfile = {
        ...newAnswer,
        answered_by: answeredByProfile || {
          id: user.id,
          first_name: "Usuario",
          last_name: "",
          avatar_url: null,
        },
      };

      return NextResponse.json({ answer: answerWithProfile }, { status: 201 });
    }
  } catch (error) {
    console.error("Error in POST /api/events/[eventId]/questions/[questionId]/answer:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
