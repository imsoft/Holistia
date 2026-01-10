import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Obtener todas las preguntas y respuestas de un evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId } = await params;

    // Obtener preguntas con respuestas y datos de usuarios
    const { data: questions, error: questionsError } = await supabase
      .from("event_questions")
      .select(`
        *,
        user:profiles!event_questions_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        answer:event_question_answers(
          id,
          answer,
          is_admin_answer,
          is_professional_answer,
          created_at,
          answered_by:profiles!event_question_answers_answered_by_user_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { error: "Error al cargar las preguntas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: questions || [] }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/events/[eventId]/questions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva pregunta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId } = await params;

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "La pregunta no puede estar vacía" },
        { status: 400 }
      );
    }

    // Verificar que el evento existe y está activo
    const { data: event, error: eventError } = await supabase
      .from("events_workshops")
      .select("id, is_active")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Evento no encontrado o no disponible" },
        { status: 404 }
      );
    }

    // Crear la pregunta
    const { data: newQuestion, error: createError } = await supabase
      .from("event_questions")
      .insert({
        event_id: eventId,
        user_id: user.id,
        question: question.trim(),
      })
      .select(`
        *,
        user:profiles!event_questions_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error("Error creating question:", createError);
      return NextResponse.json(
        { error: "Error al crear la pregunta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/events/[eventId]/questions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
