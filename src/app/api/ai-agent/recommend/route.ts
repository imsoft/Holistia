import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.type !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden usar esta función.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { query, professionals, challenges, events, conversationHistory } = body;

    if (!query || !professionals) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la API key de OpenAI esté configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'API key de OpenAI no configurada',
          message: 'Por favor, configura la variable de entorno OPENAI_API_KEY para usar esta función.'
        },
        { status: 500 }
      );
    }

    // Preparar el contexto de profesionales para el prompt
    interface Professional {
      id: string;
      first_name: string;
      last_name: string;
      profession: string;
      email: string;
      phone?: string;
      profile_photo?: string;
      specializations?: string[];
      wellness_areas?: string[];
      biography?: string;
      services?: Array<{
        name: string;
        description: string;
      }>;
    }

    const professionalsContext = professionals.map((prof: Professional) => ({
      id: prof.id,
      nombre: `${prof.first_name} ${prof.last_name}`,
      profesion: prof.profession,
      especialidades: prof.specializations || [],
      areas_bienestar: prof.wellness_areas || [],
      biografia: prof.biography || '',
      servicios: prof.services?.map(s => ({ nombre: s.name, descripcion: s.description })) || [],
      email: prof.email,
      telefono: prof.phone || 'No disponible'
    }));

    // Preparar el contexto de challenges (retos)
    interface Challenge {
      id: string;
      title: string;
      description?: string;
      short_description?: string;
      category: string;
      difficulty_level: string;
      duration_days: number;
      wellness_areas?: string[];
      created_by_type?: string;
    }

    const challengesContext = (challenges || []).map((challenge: Challenge) => ({
      id: challenge.id,
      titulo: challenge.title,
      descripcion: challenge.description || challenge.short_description || '',
      categoria: challenge.category,
      nivel_dificultad: challenge.difficulty_level,
      duracion_dias: challenge.duration_days,
      areas_bienestar: challenge.wellness_areas || [],
      tipo_creador: challenge.created_by_type || 'professional'
    }));

    // Preparar el contexto de eventos
    interface Event {
      id: string;
      name: string;
      description?: string;
      category: string;
      location: string;
      event_date: string;
      event_time: string;
      price: number;
      is_free: boolean;
      participant_level: string;
      professional_id?: string;
    }

    const eventsContext = (events || []).map((event: Event) => ({
      id: event.id,
      nombre: event.name,
      descripcion: event.description || '',
      categoria: event.category,
      ubicacion: event.location,
      fecha: event.event_date,
      hora: event.event_time,
      precio: event.price,
      es_gratis: event.is_free,
      nivel_participante: event.participant_level,
      profesional_id: event.professional_id || null
    }));

    // Crear el prompt para ChatGPT
    const systemPrompt = `Eres un asistente experto en recomendar profesionales de la salud holística, bienestar, programas (retos/challenges) y eventos.
Tu objetivo es ayudar a encontrar las mejores opciones basándote en:
- DOLORES o SÍNTOMAS específicos que el usuario menciona (ej: ansiedad, depresión, dolor de espalda, insomnio, estrés, etc.)
- OBJETIVOS DE MEJORA que el usuario quiere alcanzar (ej: perder peso, mejorar flexibilidad, meditar más, comer mejor, etc.)

Tienes acceso a la siguiente información:

PROFESIONALES APROBADOS:
${JSON.stringify(professionalsContext, null, 2)}

${challengesContext.length > 0 ? `RETOS/CHALLENGES DISPONIBLES:
${JSON.stringify(challengesContext, null, 2)}` : ''}

${eventsContext.length > 0 ? `EVENTOS Y TALLERES DISPONIBLES:
${JSON.stringify(eventsContext, null, 2)}` : ''}

ÁREAS DE BIENESTAR DISPONIBLES:
- Salud mental: Ansiedad, depresión, estrés, trauma, terapia psicológica, coaching emocional
- Espiritualidad: Meditación, mindfulness, crecimiento espiritual, conexión interior
- Actividad física: Ejercicio, yoga, pilates, entrenamiento, rehabilitación física
- Social: Relaciones interpersonales, comunicación, habilidades sociales, terapia de pareja
- Alimentación: Nutrición, dietas, alimentación saludable, trastornos alimentarios

INSTRUCCIONES PARA RECOMENDAR:
1. ANALIZA la consulta del usuario identificando:
   - ¿Qué DOLOR o SÍNTOMA menciona? (ansiedad, dolor físico, insomnio, estrés, etc.)
   - ¿Qué OBJETIVO quiere lograr? (perder peso, meditar, mejorar relaciones, etc.)
   - ¿Qué ÁREA DE BIENESTAR corresponde? (Salud mental, Espiritualidad, Actividad física, Social, Alimentación)

2. MATCHEA opciones basándote en:
   - PROFESIONALES: Especialidades, áreas de bienestar, servicios y biografía que coincidan
   - RETOS/CHALLENGES: Título, descripción, categoría, nivel de dificultad y áreas de bienestar que coincidan
   - EVENTOS: Nombre, descripción, categoría, ubicación y nivel de participante que coincidan

3. PRIORIZA opciones con:
   - Mayor coincidencia en áreas de bienestar
   - Relevancia directa con el dolor/síntoma u objetivo
   - Nivel de dificultad apropiado (para retos)
   - Disponibilidad y ubicación (para eventos)

4. RECOMIENDA una combinación balanceada:
   - Máximo 3-5 profesionales ordenados por relevancia
   - Máximo 2-3 retos/challenges si son relevantes
   - Máximo 2-3 eventos si son relevantes
   - Ordena todo por score de relevancia (más alto primero)

5. Para cada recomendación, explica CONCRETAMENTE por qué es adecuado:
   - Menciona la especialidad, categoría o área de bienestar que coincide
   - Relaciona con el dolor/síntoma u objetivo mencionado
   - Para retos: menciona duración y nivel de dificultad si es relevante
   - Para eventos: menciona fecha, ubicación y si es gratis si es relevante
   - Sé específico y claro

IMPORTANTE: Debes responder en formato JSON con la siguiente estructura:
{
  "message": "Tu respuesta amigable explicando las recomendaciones y cómo se relacionan con el dolor/objetivo mencionado",
  "recommendations": [
    {
      "type": "professional" | "challenge" | "event",
      "id": "id del profesional/reto/evento",
      "first_name": "nombre (solo para profesionales)",
      "last_name": "apellido (solo para profesionales)",
      "profession": "profesión (solo para profesionales)",
      "title": "título (solo para retos)",
      "name": "nombre (solo para eventos)",
      "email": "email (solo para profesionales)",
      "phone": "teléfono (solo para profesionales)",
      "reason": "Razón específica y concreta de por qué es recomendado para este dolor/objetivo (máximo 80 palabras). Menciona especialidades, áreas de bienestar, categorías o servicios relevantes.",
      "score": 0.95 // puntuación de 0 a 1 indicando qué tan bien coincide (0.9+ = excelente, 0.7-0.9 = bueno, <0.7 = moderado)
    }
  ]
}

Si no encuentras profesionales adecuados, explica por qué y sugiere:
- Qué tipo de profesional o especialidad sería más adecuada
- Qué información adicional necesitas del usuario
- Alternativas generales relacionadas con el área de bienestar mencionada`;

    // Preparar mensajes para la conversación
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: query }
    ];

    // Llamar a la API de OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo más económico
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }, // Forzar respuesta JSON
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Error al comunicarse con OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0].message.content;

    // Parsear la respuesta JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch (parseError) {
      console.error('Error parsing JSON response:', assistantMessage);
      // Si falla el parseo, devolver una respuesta por defecto
      parsedResponse = {
        message: assistantMessage,
        recommendations: []
      };
    }

    // Enriquecer recomendaciones de profesionales con datos completos de la lista original
    if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
      const enrichedRecommendations = parsedResponse.recommendations.map((rec: any) => {
        if (rec.type === 'professional' && rec.id) {
          // Buscar el profesional en la lista original para obtener todos los datos correctos
          const originalProf = professionals.find((p: Professional) => p.id === rec.id);
          if (originalProf) {
            return {
              ...rec,
              // Usar los datos correctos de la lista original, no los que devuelve el AI
              first_name: originalProf.first_name,
              last_name: originalProf.last_name,
              profession: originalProf.profession,
              email: originalProf.email,
              phone: originalProf.phone,
              profile_photo: originalProf.profile_photo || null,
              // Preservar el reason generado por el AI (no sobrescribirlo)
              reason: rec.reason
            };
          }
        }
        return rec;
      });
      parsedResponse.recommendations = enrichedRecommendations;
    }

    // Agregar información de uso de tokens
    return NextResponse.json({
      ...parsedResponse,
      usage: openaiData.usage // Incluir estadísticas de uso
    });

  } catch (error) {
    console.error('Error in AI agent recommendation:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
