import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;
    const body = await request.json().catch(() => ({}));

    const participantId = typeof body?.participant_id === 'string' ? body.participant_id : null;
    if (!participantId) {
      return NextResponse.json(
        { error: 'participant_id es requerido' },
        { status: 400 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, created_by_user_id')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Reto no encontrado' }, { status: 404 });
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('type, account_active')
      .eq('id', user.id)
      .single();

    const isAdmin = requesterProfile?.type === 'admin' && requesterProfile?.account_active === true;
    const isCreator = challenge.created_by_user_id === user.id;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar participantes de este reto' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('challenge_purchases')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('participant_id', participantId);

    if (deleteError) {
      console.error('Error deleting challenge participant:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Error al eliminar participante' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]/participants:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

