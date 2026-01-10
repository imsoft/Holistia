import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener mensajes de una conversación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { conversationId } = await params;
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario tiene acceso a esta conversación
    const { data: conversation, error: convError } = await supabase
      .from('direct_conversations')
      .select('user_id, professional_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el usuario es el usuario o el profesional de la conversación
    const { data: professionalApp } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', conversation.professional_id)
      .maybeSingle();

    const hasAccess = conversation.user_id === user.id || !!professionalApp;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta conversación' },
        { status: 403 }
      );
    }

    // Obtener mensajes
    const { data: messages, error: messagesError } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Error al obtener mensajes' },
        { status: 500 }
      );
    }

    // Marcar mensajes como leídos si el usuario es el receptor
    const unreadMessages = messages?.filter(msg => 
      !msg.is_read && msg.sender_id !== user.id
    ) || [];

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      await supabase
        .from('direct_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', messageIds);

      // Actualizar contador de no leídos en la conversación
      if (conversation.user_id === user.id) {
        await supabase
          .from('direct_conversations')
          .update({ user_unread_count: 0 })
          .eq('id', conversationId);
      } else {
        await supabase
          .from('direct_conversations')
          .update({ professional_unread_count: 0 })
          .eq('id', conversationId);
      }
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET /api/messages/conversations/[conversationId]/messages:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar un mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { conversationId } = await params;
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene acceso a esta conversación
    const { data: conversation, error: convError } = await supabase
      .from('direct_conversations')
      .select('user_id, professional_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el usuario es el usuario o el profesional
    const { data: professionalApp } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', conversation.professional_id)
      .maybeSingle();

    const hasAccess = conversation.user_id === user.id || !!professionalApp;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta conversación' },
        { status: 403 }
      );
    }

    // Determinar el tipo de remitente
    const senderType = conversation.user_id === user.id ? 'user' : 'professional';

    // Crear el mensaje
    const { data: message, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: senderType,
        content: content.trim(),
      })
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Error al enviar mensaje' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/messages/conversations/[conversationId]/messages:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
