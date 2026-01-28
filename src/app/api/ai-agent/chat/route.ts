import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Función para obtener estadísticas en tiempo real
async function getPlatformStats(supabase: any) {
  try {
    const [professionals, events, challenges, appointments, users] = await Promise.all([
      supabase
        .from('professional_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('is_active', true),
      supabase
        .from('events_workshops')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0]),
      supabase
        .from('challenges')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed', 'paid']),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
    ]);

    return {
      total_professionals: professionals.count || 0,
      upcoming_events: events.count || 0,
      active_challenges: challenges.count || 0,
      active_appointments: appointments.count || 0,
      total_users: users.count || 0
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    return null;
  }
}

// Función para obtener información específica cuando se solicite
async function getSpecificData(supabase: any, query: string) {
  const lowerQuery = query.toLowerCase();
  
  // Detectar si se pregunta por profesionales
  if (lowerQuery.includes('profesional') || lowerQuery.includes('terapeuta') || lowerQuery.includes('coach')) {
    const { data, error } = await supabase
      .from('professional_applications')
      .select('id, first_name, last_name, profession, email, is_active, status')
      .eq('status', 'approved')
      .eq('is_active', true)
      .limit(10);
    
    if (!error && data) {
      return { type: 'professionals', data: data };
    }
  }
  
  // Detectar si se pregunta por eventos
  if (lowerQuery.includes('evento') || lowerQuery.includes('taller') || lowerQuery.includes('workshop')) {
    const { data, error } = await supabase
      .from('events_workshops')
      .select('id, name, event_date, location, is_active')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(10);
    
    if (!error && data) {
      return { type: 'events', data: data };
    }
  }
  
  // Detectar si se pregunta por retos
  if (lowerQuery.includes('reto') || lowerQuery.includes('challenge') || lowerQuery.includes('desafío')) {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, title, category, difficulty_level, duration_days, is_active')
      .eq('is_active', true)
      .limit(10);
    
    if (!error && data) {
      return { type: 'challenges', data: data };
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación y que sea admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

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
    const { query, conversationHistory = [] } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'La consulta es requerida' },
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

    // Obtener estadísticas de la plataforma
    const platformStats = await getPlatformStats(supabase);
    
    // Intentar obtener datos específicos si la consulta lo requiere
    const specificData = await getSpecificData(supabase, query);

    // Crear el system prompt con información completa de Holistia
    const systemPrompt = `Eres un asistente experto de Holistia, una plataforma integral de bienestar y salud mental en México que conecta profesionales de la salud con personas que buscan mejorar su calidad de vida.

INFORMACIÓN SOBRE HOLISTIA:

**¿Qué es Holistia?**
Holistia es una plataforma que facilita la conexión entre profesionales de bienestar (psicólogos, terapeutas, coaches, nutriólogos) y personas que buscan mejorar su salud integral.

**Funcionalidades para Pacientes/Usuarios:**
- Explorar y descubrir profesionales de bienestar verificados
- Agendar citas con profesionales (presenciales u online)
- Registrarse a eventos y talleres
- Sistema de favoritos para profesionales, programas, eventos, restaurantes y centros holísticos
- Gestión de citas y eventos registrados
- Perfil personal editable
- Sistema de mensajería directa con profesionales
- Crear y participar en retos de bienestar (challenges)
- Sistema de seguimiento (follows) de usuarios y expertos
- Feed social con publicaciones de check-ins de retos
- Sistema de preguntas y respuestas en eventos
- Explorar programas digitales, restaurantes y centros holísticos

**Funcionalidades para Profesionales:**
- Gestión de servicios (sesiones individuales, programas o cotizaciones)
- Configuración de disponibilidad y horarios
- Sincronización con Google Calendar
- Gestión de citas y pacientes
- Creación y organización de eventos
- Sistema de preguntas y respuestas en eventos
- Galería de fotos profesional
- Integración con Stripe Connect para recibir pagos
- Dashboard con métricas y gestión
- Sistema de mensajería directa con pacientes
- Crear retos de bienestar para pacientes
- Agregar pacientes existentes a retos

**Sistema de Pagos:**
- Stripe para procesamiento de pagos
- Stripe Connect para profesionales (reciben pagos directamente)
- Comisión de plataforma: 15% para citas, 20% para eventos
- Los profesionales pueden recibir pagos directamente en su cuenta de Stripe

**Tipos de Contenido:**
- Profesionales: Psicólogos, terapeutas, coaches, nutriólogos, etc.
- Eventos y Talleres: Eventos presenciales y online
- Retos/Challenges: Programas de bienestar con duración específica
- Productos Digitales: Programas, workbooks, cursos online
- Restaurantes: Establecimientos de comida saludable
- Centros Holísticos: Centros de bienestar con múltiples servicios

**Áreas de Bienestar:**
- Salud mental: Ansiedad, depresión, estrés, trauma, terapia psicológica, coaching emocional
- Espiritualidad: Meditación, mindfulness, crecimiento espiritual, conexión interior
- Actividad física: Ejercicio, yoga, pilates, entrenamiento, rehabilitación física
- Social: Relaciones interpersonales, comunicación, habilidades sociales, terapia de pareja
- Alimentación: Nutrición, dietas, alimentación saludable, trastornos alimentarios

**Estadísticas Actuales de la Plataforma:**
${platformStats ? JSON.stringify(platformStats, null, 2) : 'No disponibles en este momento'}

${specificData ? `\n**Datos Específicos Solicitados:**\n${JSON.stringify(specificData, null, 2)}` : ''}

**INSTRUCCIONES:**
1. Responde de manera conversacional, amigable y profesional
2. Usa la información de estadísticas y datos específicos cuando sea relevante
3. Si el usuario pregunta sobre algo específico (profesionales, eventos, retos), usa los datos proporcionados
4. Si no tienes información específica, explica lo que sabes sobre la funcionalidad general
5. Mantén el contexto de la conversación anterior
6. Sé específico y útil en tus respuestas
7. Si el usuario pregunta algo que no puedes responder con certeza, sé honesto y ofrece ayudar de otra manera

**IMPORTANTE:** 
- NO debes ayudar con tareas administrativas específicas (como aprobar profesionales, modificar datos, etc.)
- Puedes explicar cómo funcionan las cosas, pero no ejecutar acciones administrativas
- Responde siempre en español
- Mantén un tono profesional pero cercano`;

    // Preparar mensajes para la conversación con memoria
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
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
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Error al comunicarse con OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0].message.content;

    // Agregar información de uso de tokens
    return NextResponse.json({
      message: assistantMessage,
      usage: openaiData.usage
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
