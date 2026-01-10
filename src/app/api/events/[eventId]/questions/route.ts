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

    // Obtener preguntas sin relaciones anidadas
    const { data: questions, error: questionsError } = await supabase
      .from("event_questions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { error: "Error al cargar las preguntas" },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ questions: [] }, { status: 200 });
    }

    // Obtener respuestas para todas las preguntas
    const questionIds = questions.map((q: any) => q.id);
    const { data: answers, error: answersError } = await supabase
      .from("event_question_answers")
      .select("*")
      .in("question_id", questionIds)
      .order("created_at", { ascending: true });

    if (answersError) {
      console.error("Error fetching answers:", answersError);
      // Continuar sin respuestas si hay error
    }

    // Obtener IDs de usuarios (quienes preguntan y quienes responden)
    const userIds = new Set<string>();
    questions.forEach((q: any) => {
      userIds.add(q.user_id);
    });
    if (answers) {
      answers.forEach((a: any) => {
        if (a.answered_by_user_id) {
          userIds.add(a.answered_by_user_id);
        }
      });
    }

    // Obtener perfiles de usuarios por separado
    let profilesMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", Array.from(userIds));

      if (!profilesError && profiles) {
        profiles.forEach((profile) => {
          profilesMap[profile.id] = profile;
        });
      }
    }

    // Combinar datos: agregar usuario a cada pregunta y respuesta a cada pregunta
    const questionsWithData = questions.map((question: any) => {
      const questionAnswer = answers?.find((a: any) => a.question_id === question.id);

      return {
        ...question,
        user: profilesMap[question.user_id] || {
          id: question.user_id,
          first_name: "Usuario",
          last_name: "",
          avatar_url: null,
        },
        answer: questionAnswer
          ? {
              ...questionAnswer,
              answered_by: profilesMap[questionAnswer.answered_by_user_id] || {
                id: questionAnswer.answered_by_user_id,
                first_name: "Usuario",
                last_name: "",
                avatar_url: null,
              },
            }
          : undefined,
      };
    });

    return NextResponse.json({ questions: questionsWithData || [] }, { status: 200 });
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
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating question:", createError);
      return NextResponse.json(
        { error: "Error al crear la pregunta" },
        { status: 500 }
      );
    }

    // Obtener perfil del usuario por separado
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    // Combinar datos
    const questionWithUser = {
      ...newQuestion,
      user: userProfile || {
        id: user.id,
        first_name: "Usuario",
        last_name: "",
        avatar_url: null,
      },
    };

    return NextResponse.json({ question: questionWithUser }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/events/[eventId]/questions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
