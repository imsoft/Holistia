import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendNewMessageNotification } from '@/lib/email-sender';

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
      .select('*')
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
    const unreadMessages = (messages || []).filter((msg: any) => 
      !msg.is_read && msg.sender_id !== user.id
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg: any) => msg.id);
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

    // Obtener perfiles de los remitentes por separado
    const senderIds = [...new Set((messages || []).map((msg: any) => msg.sender_id))];
    let profilesMap: Record<string, any> = {};
    
    if (senderIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', senderIds);
      
      if (profilesData) {
        profilesData.forEach((profile) => {
          profilesMap[profile.id] = profile;
        });
      }
    }
    
    // Combinar datos
    const messagesWithProfiles = (messages || []).map((msg: any) => ({
      ...msg,
      sender: profilesMap[msg.sender_id] || null,
    }));

    return NextResponse.json({ messages: messagesWithProfiles || [] });
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
      .select('*')
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Error al enviar mensaje' },
        { status: 500 }
      );
    }

    // Obtener perfil del remitente por separado
    let senderProfile: any = null;
    const { data: senderProfileData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    
    if (senderProfileData) {
      senderProfile = senderProfileData;
    }

    // Combinar datos del mensaje con el perfil
    const messageWithSender = {
      ...message,
      sender: senderProfile,
    };

    // Enviar notificación por email al receptor (no bloqueante)
    try {
      // Determinar quién es el receptor
      const isSenderUser = conversation.user_id === user.id;
      
      let recipientName = '';
      let recipientEmail = '';
      let messagesUrl = '';

      if (isSenderUser) {
        // El remitente es el usuario, el receptor es el profesional
        const { data: professional } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, user_id')
          .eq('id', conversation.professional_id)
          .single();

        if (professional) {
          recipientName = `${professional.first_name} ${professional.last_name}`;
          messagesUrl = `https://www.holistia.io/professional/${professional.user_id}/messages`;
          
          // Obtener email del perfil del profesional
          const { data: professionalProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', professional.user_id)
            .single();
          
          if (professionalProfile) {
            recipientEmail = professionalProfile.email || '';
          }
        }
      } else {
        // El remitente es el profesional, el receptor es el usuario
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', conversation.user_id)
          .single();

        if (userProfile) {
          recipientName = `${userProfile.first_name} ${userProfile.last_name}`;
          recipientEmail = userProfile.email || '';
          messagesUrl = `https://www.holistia.io/patient/${userProfile.id}/messages`;
        }
      }

      // Obtener nombre del remitente
      const senderName = senderProfile
        ? `${senderProfile.first_name} ${senderProfile.last_name}`
        : 'Usuario';

      // Preparar preview del mensaje (primeros 150 caracteres)
      const messagePreview = messageWithSender.content.length > 150
        ? messageWithSender.content.substring(0, 150) + '...'
        : messageWithSender.content;

      // Formatear fecha del mensaje
      const messageTime = new Date(messageWithSender.created_at).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Enviar email solo si tenemos el email del receptor
      if (recipientEmail && recipientName) {
        await sendNewMessageNotification({
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          sender_name: senderName,
          sender_type: senderType,
          message_preview: messagePreview,
          message_time: messageTime,
          messages_url: messagesUrl,
        });
      }
    } catch (emailError) {
      // No fallar la creación del mensaje si el email falla
      console.error('Error sending message notification email:', emailError);
    }

    return NextResponse.json({ message: messageWithSender }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/messages/conversations/[conversationId]/messages:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
