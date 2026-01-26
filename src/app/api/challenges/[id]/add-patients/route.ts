import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Verificar que el reto existe y que el usuario es el creador (profesional)
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, created_by_user_id, created_by_type, professional_id')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el creador del reto y es profesional
    if (challenge.created_by_user_id !== user.id || challenge.created_by_type !== 'professional') {
      return NextResponse.json(
        { error: 'Solo el profesional creador del reto puede agregar pacientes' },
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
