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
      // Si es profesional, obtener AMBAS: donde es el profesional Y donde es el paciente (user_id)
      const [asProfessionalRes, asUserRes] = await Promise.all([
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
          .eq('professional_id', professionalApp.id)
          .order('last_message_at', { ascending: false }),
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
      ]);

      if (asProfessionalRes.error) throw asProfessionalRes.error;
      if (asUserRes.error) throw asUserRes.error;

      const asProfessional = asProfessionalRes.data || [];
      const asUser = asUserRes.data || [];
      const seenIds = new Set<string>();
      const merged: typeof asProfessional = [];
      for (const c of asProfessional) {
        if (c?.id && !seenIds.has(c.id)) {
          seenIds.add(c.id);
          merged.push(c);
        }
      }
      for (const c of asUser) {
        if (c?.id && !seenIds.has(c.id)) {
          seenIds.add(c.id);
          merged.push(c);
        }
      }

      const sorted = merged.slice().sort((a: any, b: any) => {
        const ta = a.last_message_at || a.created_at;
        const tb = b.last_message_at || b.created_at;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });

      const userIds = [...new Set(sorted.map((c: any) => c.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);
        if (profilesData) {
          profilesData.forEach((p) => { profilesMap[p.id] = p; });
        }
      }

      conversations = sorted.map((conv: any) => ({
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
      const rawList = conversationsResult.data || [];

      // Ordenar por última actividad (conversaciones nuevas sin mensajes usan created_at)
      const sorted = rawList.slice().sort((a: any, b: any) => {
        const ta = a.last_message_at || a.created_at;
        const tb = b.last_message_at || b.created_at;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });

      // Combinar datos
      conversations = sorted.map((conv: any) => ({
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
