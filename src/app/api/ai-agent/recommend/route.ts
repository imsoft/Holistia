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
    }

    const professionalsContext = professionals.map((prof: Professional) => ({
      id: prof.id,
      nombre: `${prof.first_name} ${prof.last_name}`,
      profesion: prof.profession,
      email: prof.email,
      telefono: prof.phone || 'No disponible'
    }));

    // Crear el prompt para ChatGPT
    const systemPrompt = `Eres un asistente experto en recomendar profesionales de la salud holística y bienestar.
Tu objetivo es ayudar a encontrar el mejor profesional basándote en las necesidades del usuario.

Tienes acceso a la siguiente lista de profesionales aprobados:
${JSON.stringify(professionalsContext, null, 2)}

Cuando un usuario haga una consulta:
1. Analiza cuidadosamente su necesidad
2. Identifica los profesionales más adecuados (máximo 3-5)
3. Explica brevemente por qué cada uno es una buena opción
4. Sé amable, profesional y empático

IMPORTANTE: Debes responder en formato JSON con la siguiente estructura:
{
  "message": "Tu respuesta amigable al usuario explicando las recomendaciones",
  "recommendations": [
    {
      "id": "id del profesional",
      "first_name": "nombre",
      "last_name": "apellido",
      "profession": "profesión",
      "email": "email",
      "phone": "teléfono",
      "reason": "breve razón de por qué es recomendado (máximo 50 palabras)",
      "score": 0.95 // puntuación de 0 a 1 indicando qué tan bien coincide
    }
  ]
}

Si no encuentras profesionales adecuados, explica por qué y sugiere alternativas o pide más información.`;

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

    return NextResponse.json(parsedResponse);

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
