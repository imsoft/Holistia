import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendChallengeMessageNotification } from '@/lib/email-sender';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message_id, conversation_id, sender_id, content } = body;

    if (!message_id || !conversation_id || !sender_id || !content) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Obtener challenge_id desde la conversación si no se proporciona en la URL
    let actualChallengeId = challengeId;
    if (!actualChallengeId && conversation_id) {
      const { data: conversation } = await supabase
        .from('challenge_conversations')
        .select('challenge_id')
        .eq('id', conversation_id)
        .single();
      
      if (conversation) {
        actualChallengeId = conversation.challenge_id;
      }
    }

    if (!actualChallengeId) {
      return NextResponse.json(
        { error: 'ID de reto no encontrado' },
        { status: 400 }
      );
    }

    // Obtener información del reto
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, created_by_user_id, created_by_type')
      .eq('id', actualChallengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener información del remitente
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('id', sender_id)
      .maybeSingle();

    if (senderError || !senderProfile) {
      return NextResponse.json(
        { error: 'Remitente no encontrado' },
        { status: 404 }
      );
    }

    const senderName = senderProfile.first_name && senderProfile.last_name
      ? `${senderProfile.first_name} ${senderProfile.last_name}`.trim()
      : senderProfile.email?.split('@')[0] || 'Usuario';

    // Determinar tipo de remitente
    const { data: professional } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', sender_id)
      .maybeSingle();

    const senderType = professional ? 'professional' : 'user';

    // Crear preview del mensaje
    const messagePreview = content.length > 100
      ? content.substring(0, 100) + '...'
      : content;

    // Formatear tiempo
    const messageTime = formatDistanceToNow(new Date(), {
      addSuffix: true,
      locale: es,
    });

    // Construir URL del reto
    const challengeUrl = `https://www.holistia.io/my-challenges?challenge=${actualChallengeId}#chat`;

    // Obtener todos los participantes del reto (excepto el remitente)
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_purchases')
      .select('participant_id')
      .eq('challenge_id', actualChallengeId)
      .eq('access_granted', true)
      .neq('participant_id', sender_id);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Error al obtener participantes' },
        { status: 500 }
      );
    }

    const participantIds = participants?.map(p => p.participant_id) || [];

    // Si el reto fue creado por un profesional y no está en la lista de participantes,
    // agregarlo a la lista de destinatarios
    if (challenge.created_by_type === 'professional' 
        && challenge.created_by_user_id 
        && challenge.created_by_user_id !== sender_id
        && !participantIds.includes(challenge.created_by_user_id)) {
      participantIds.push(challenge.created_by_user_id);
    }

    // Obtener perfiles de los participantes para enviar emails
    const { data: recipientProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', participantIds);

    if (profilesError) {
      console.error('Error fetching recipient profiles:', profilesError);
    }

    // Enviar emails a todos los participantes
    const emailPromises = (recipientProfiles || []).map(async (profile) => {
      const recipientName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : profile.email?.split('@')[0] || 'Usuario';

      return sendChallengeMessageNotification({
        recipient_name: recipientName,
        recipient_email: profile.email || '',
        sender_name: senderName,
        sender_type: senderType,
        sender_avatar_url: senderProfile.avatar_url,
        challenge_title: challenge.title,
        message_preview: messagePreview,
        message_time: messageTime,
        challenge_url: challengeUrl,
      });
    });

    // Ejecutar envío de emails en paralelo (no bloquear si alguno falla)
    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      message: 'Notificaciones enviadas',
      recipients_count: participantIds.length,
    });

  } catch (error) {
    console.error('Error in challenge message notification:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificaciones' },
      { status: 500 }
    );
  }
}
