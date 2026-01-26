import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendChallengeInvitationEmail } from '@/lib/email-sender';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;
    const body = await request.json();

    const { patient_ids } = body;

    if (!patient_ids || !Array.isArray(patient_ids) || patient_ids.length === 0) {
      return NextResponse.json(
        { error: 'patient_ids es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el reto existe
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, created_by_user_id, created_by_type, professional_id')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Permisos:
    // - El creador del reto (sin importar tipo) puede agregar participantes
    // - Admin puede agregar participantes a cualquier reto
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('type, first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const isAdmin = requesterProfile?.type === 'admin';
    const isCreator = challenge.created_by_user_id === user.id;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para agregar participantes a este reto' },
        { status: 403 }
      );
    }

    // Verificar que los pacientes existen y están activos
    const { data: patients } = await supabase
      .from('profiles')
      .select('id')
      .in('id', patient_ids)
      .eq('type', 'patient')
      .eq('account_active', true);

    if (!patients || patients.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron pacientes válidos' },
        { status: 400 }
      );
    }

    const validIds = patients.map(p => p.id);

    // Verificar cuáles pacientes ya están en el reto
    const { data: existingPurchases } = await supabase
      .from('challenge_purchases')
      .select('participant_id')
      .eq('challenge_id', challengeId)
      .in('participant_id', validIds);

    const existingPatientIds = new Set(existingPurchases?.map(p => p.participant_id) || []);
    const newPatientIds = validIds.filter(id => !existingPatientIds.has(id));

    if (newPatientIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos los pacientes seleccionados ya están en el reto',
        added: 0,
        already_in: validIds.length,
      });
    }

    // Crear challenge_purchases para los nuevos pacientes
    const purchasesToInsert = newPatientIds.map(patientId => ({
      challenge_id: challengeId,
      participant_id: patientId,
      access_granted: true, // Los pacientes agregados por el profesional tienen acceso automático
    }));

    const { data: newPurchases, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .insert(purchasesToInsert)
      .select();

    if (purchaseError || !newPurchases) {
      console.error('Error creating purchases:', purchaseError);
      return NextResponse.json(
        { error: 'Error al agregar pacientes al reto' },
        { status: 500 }
      );
    }

    // Enviar email a los nuevos participantes (no romper el flujo si falla)
    try {
      const { data: recipients } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', newPatientIds);

      const inviterName = (() => {
        const first = requesterProfile?.first_name?.trim();
        const last = requesterProfile?.last_name?.trim();
        const full = [first, last].filter(Boolean).join(' ').trim();
        if (full) return full;
        const email = requesterProfile?.email || user.email || 'Usuario';
        return email.split('@')[0] || 'Usuario';
      })();

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holistia.io';
      const challengeUrl = `${siteUrl}/my-challenges`;

      await Promise.allSettled(
        (recipients || [])
          .filter((r) => typeof r.email === 'string' && r.email.length > 3)
          .map((recipient) => {
            const recipientName = [recipient.first_name, recipient.last_name]
              .filter(Boolean)
              .join(' ')
              .trim() || (recipient.email?.split('@')[0] ?? 'Usuario');

            return sendChallengeInvitationEmail({
              recipient_name: recipientName,
              recipient_email: recipient.email,
              inviter_name: inviterName,
              challenge_title: challenge.title || 'Reto',
              challenge_url: challengeUrl,
              action: 'added',
            });
          })
      );
    } catch (emailError) {
      console.error('Error sending challenge added emails:', emailError);
      // No fallar
    }

    return NextResponse.json({
      success: true,
      message: `${newPurchases.length} paciente(s) agregado(s) exitosamente`,
      added: newPurchases.length,
      already_in: existingPatientIds.size,
      purchases: newPurchases,
    });

  } catch (error) {
    console.error('Error in POST /api/challenges/[id]/add-patients:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
