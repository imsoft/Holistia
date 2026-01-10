import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si el usuario es profesional
    const { data: professionalApp } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    let conversations;

    if (professionalApp) {
      // Si es profesional, obtener conversaciones donde es el profesional
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user_id,
          professional_id,
          last_message_at,
          last_message_preview,
          user_unread_count,
          professional_unread_count,
          created_at,
          user:profiles!direct_conversations_user_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          professional:professional_applications!direct_conversations_professional_id_fkey(
            id,
            first_name,
            last_name,
            profile_photo
          )
        `)
        .eq('professional_id', professionalApp.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      conversations = data;
    } else {
      // Si es usuario (paciente), obtener conversaciones donde es el usuario
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user_id,
          professional_id,
          last_message_at,
          last_message_preview,
          user_unread_count,
          professional_unread_count,
          created_at,
          user:profiles!direct_conversations_user_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          professional:professional_applications!direct_conversations_professional_id_fkey(
            id,
            first_name,
            last_name,
            profile_photo
          )
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      conversations = data;
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva conversación
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { professional_id } = body;

    if (!professional_id) {
      return NextResponse.json(
        { error: 'professional_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el profesional existe y está aprobado
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('id, status')
      .eq('id', professional_id)
      .eq('status', 'approved')
      .single();

    if (profError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado o no aprobado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario no es el mismo profesional
    const { data: userProfessional } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', professional_id)
      .maybeSingle();

    if (userProfessional) {
      return NextResponse.json(
        { error: 'No puedes enviarte mensajes a ti mismo' },
        { status: 400 }
      );
    }

    // Buscar conversación existente
    const { data: existingConversation } = await supabase
      .from('direct_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('professional_id', professional_id)
      .maybeSingle();

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Crear nueva conversación
    const { data: conversation, error: convError } = await supabase
      .from('direct_conversations')
      .insert({
        user_id: user.id,
        professional_id: professional_id,
      })
      .select(`
        *,
        user:profiles!direct_conversations_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        professional:professional_applications!direct_conversations_professional_id_fkey(
          id,
          first_name,
          last_name,
          profile_photo
        )
      `)
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json(
        { error: 'Error al crear conversación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/messages/conversations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
