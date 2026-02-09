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
          professional_applications!direct_conversations_professional_id_fkey(
            id,
            first_name,
            last_name,
            profile_photo
          )
        `)
        .eq('professional_id', professionalApp.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      // Obtener perfiles de usuarios por separado
      const userIds = (data || []).map((conv: any) => conv.user_id);
      let profilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);
        
        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile;
          });
        }
      }
      
      // Combinar datos
      conversations = (data || []).map((conv: any) => ({
        ...conv,
        user: profilesMap[conv.user_id] || null,
        professional: conv.professional_applications || null,
      }));
    } else {
      // Si es usuario (paciente), obtener conversaciones y perfil en paralelo
      const [conversationsResult, profileResult] = await Promise.all([
        supabase
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
            professional_applications!direct_conversations_professional_id_fkey(
              id,
              first_name,
              last_name,
              profile_photo
            )
          `)
          .eq('user_id', user.id)
          .order('last_message_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (conversationsResult.error) throw conversationsResult.error;

      const userProfile = profileResult.data || null;

      // Combinar datos
      conversations = (conversationsResult.data || []).map((conv: any) => ({
        ...conv,
        user: userProfile,
        professional: conv.professional_applications || null,
      }));
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

    // Verificar profesional, auto-mensaje y conversación existente en paralelo
    const [profResult, selfCheckResult, existingConvResult] = await Promise.all([
      supabase
        .from('professional_applications')
        .select('id, status')
        .eq('id', professional_id)
        .eq('status', 'approved')
        .maybeSingle(),
      supabase
        .from('professional_applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', professional_id)
        .maybeSingle(),
      supabase
        .from('direct_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('professional_id', professional_id)
        .maybeSingle(),
    ]);

    if (!profResult.data) {
      return NextResponse.json(
        { error: 'Profesional no encontrado o no aprobado' },
        { status: 404 }
      );
    }

    if (selfCheckResult.data) {
      return NextResponse.json(
        { error: 'No puedes enviarte mensajes a ti mismo' },
        { status: 400 }
      );
    }

    if (existingConvResult.data) {
      return NextResponse.json({ conversation: existingConvResult.data });
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
        professional_applications!direct_conversations_professional_id_fkey(
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

    // Obtener perfil del usuario por separado
    let userProfile: any = null;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileData) {
      userProfile = profileData;
    }

    // Combinar datos
    const conversationWithProfiles = {
      ...conversation,
      user: userProfile,
      professional: conversation.professional_applications || null,
    };

    return NextResponse.json({ conversation: conversationWithProfiles }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/messages/conversations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
