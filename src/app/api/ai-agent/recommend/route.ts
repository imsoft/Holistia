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
    const { query, professionals, conversationHistory } = body;

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

    // Crear el prompt para ChatGPT
    const systemPrompt = `Eres un asistente experto en recomendar profesionales de la salud holística, bienestar, programas (retos/challenges) y eventos.
Tu objetivo es ayudar a encontrar las mejores opciones basándote en:
- DOLORES o SÍNTOMAS específicos que el usuario menciona (ej: ansiedad, depresión, dolor de espalda, insomnio, estrés, etc.)
- OBJETIVOS DE MEJORA que el usuario quiere alcanzar (ej: perder peso, mejorar flexibilidad, meditar más, comer mejor, etc.)

Tienes acceso a la siguiente lista de profesionales aprobados:
${JSON.stringify(professionalsContext, null, 2)}

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

2. MATCHEA profesionales basándote en:
   - Especialidades que coincidan con el dolor/síntoma u objetivo
   - Áreas de bienestar que correspondan
   - Servicios que ofrecen relacionados
   - Biografía que mencione experiencia relevante

3. PRIORIZA profesionales con:
   - Mayor coincidencia en especialidades
   - Áreas de bienestar que correspondan exactamente
   - Experiencia relevante en la biografía
   - Servicios específicos para el problema/objetivo

4. RECOMIENDA máximo 3-5 profesionales ordenados por relevancia (score más alto primero)

5. Para cada recomendación, explica CONCRETAMENTE por qué es adecuado:
   - Menciona la especialidad o área de bienestar que coincide
   - Relaciona con el dolor/síntoma u objetivo mencionado
   - Sé específico y claro

IMPORTANTE: Debes responder en formato JSON con la siguiente estructura:
{
  "message": "Tu respuesta amigable explicando las recomendaciones y cómo se relacionan con el dolor/objetivo mencionado",
  "recommendations": [
    {
      "id": "id del profesional",
      "first_name": "nombre",
      "last_name": "apellido",
      "profession": "profesión",
      "email": "email",
      "phone": "teléfono",
      "reason": "Razón específica y concreta de por qué es recomendado para este dolor/objetivo (máximo 80 palabras). Menciona especialidades, áreas de bienestar o servicios relevantes.",
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
