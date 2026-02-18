import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { isSlotBlocked, isWorkingDay, isWithinWorkingHours, getWorkingHoursForDay, getDayOfWeekFromDate } from '@/lib/availability';
import { slotsOverlap } from '@/lib/appointment-conflict';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting checkout session creation...');
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { 
      appointment_id, 
      service_amount, 
      professional_id, 
      description,
      // Nuevos campos para crear la cita
      appointment_date,
      appointment_time,
      appointment_type,
      notes
    } = body;

    // Validate required fields
    if (!service_amount || !professional_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Si no hay appointment_id, necesitamos los datos para crear la cita
    if (!appointment_id && (!appointment_date || !appointment_time || !appointment_type)) {
      return NextResponse.json(
        { error: 'Faltan datos de la cita para crear la reserva' },
        { status: 400 }
      );
    }

    // Validate service amount
    if (typeof service_amount !== 'number' || service_amount <= 0) {
      return NextResponse.json(
        { error: 'Monto de servicio inválido' },
        { status: 400 }
      );
    }

    let appointmentId = appointment_id;
    
    // Si no hay appointment_id, crear la cita primero
    if (!appointmentId) {
      console.log('🔄 Creating new appointment...');

      // Verificar que no exista una cita duplicada (del mismo paciente)
      console.log('🔍 Checking for duplicate appointment...');
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', user.id)
        .eq('professional_id', professional_id)
        .eq('appointment_date', appointment_date)
        .eq('appointment_time', appointment_time)
        .in('status', ['pending', 'confirmed', 'paid'])
        .maybeSingle();

      if (existingAppointment) {
        console.log('⚠️ Duplicate appointment found:', existingAppointment.id);
        return NextResponse.json(
          { error: 'Ya existe una cita para esta fecha y hora. Por favor elige otro horario.' },
          { status: 400 }
        );
      }

      // Verificar que no exista otra cita en el mismo horario (de cualquier paciente)
      console.log('🔍 Checking for slot availability...');
      const { data: existingSlotAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('professional_id', professional_id)
        .eq('appointment_date', appointment_date)
        .eq('appointment_time', appointment_time)
        .in('status', ['pending', 'confirmed', 'paid'])
        .maybeSingle();

      if (existingSlotAppointment) {
        console.log('⚠️ Slot already taken by another patient:', existingSlotAppointment.id);
        return NextResponse.json(
          { error: 'Este horario ya no está disponible. Por favor elige otro horario.' },
          { status: 400 }
        );
      }

      // Verificar que no haya solapamiento con otras citas (misma fecha, mismo profesional)
      const { data: existingOnDate } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('professional_id', professional_id)
        .eq('appointment_date', appointment_date)
        .not('status', 'eq', 'cancelled');

      if (existingOnDate?.length && slotsOverlap(
        { appointment_time: appointment_time, duration_minutes: 50 },
        existingOnDate
      )) {
        return NextResponse.json(
          { error: 'Este horario se solapa con otra cita. Por favor elige otro horario.' },
          { status: 400 }
        );
      }

      // Verificar que el día sea laboral y la hora esté dentro del horario del profesional
      console.log('🔍 Checking working days/hours...');
      const { data: profWorkingHours } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days, per_day_schedule')
        .eq('id', professional_id)
        .single();

      if (profWorkingHours) {
        const workingDays = profWorkingHours.working_days?.length ? profWorkingHours.working_days : [1, 2, 3, 4, 5];
        const timeNorm = appointment_time.substring(0, 5);

        if (!isWorkingDay(appointment_date, workingDays)) {
          return NextResponse.json(
            { error: 'Este día no está dentro del horario laboral del profesional.' },
            { status: 400 }
          );
        }

        const dayOfWeek = getDayOfWeekFromDate(appointment_date);
        const dayHours = getWorkingHoursForDay(dayOfWeek, {
          working_start_time: profWorkingHours.working_start_time || '09:00',
          working_end_time: profWorkingHours.working_end_time || '18:00',
          working_days: workingDays,
          per_day_schedule: profWorkingHours.per_day_schedule ?? null,
        });
        const startTime = dayHours.start;
        const endTime = dayHours.end;

        if (!isWithinWorkingHours(timeNorm, startTime, endTime)) {
          return NextResponse.json(
            { error: 'Este horario está fuera del horario laboral del profesional.' },
            { status: 400 }
          );
        }
      }

      // Verificar que el horario no esté bloqueado (bloques manuales, Google Calendar, etc.)
      // Usa la lógica compartida de lib/availability.ts para consistencia con el client-side
      console.log('🔍 Checking for availability blocks...');
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professional_id);

      if (blocks && blocks.length > 0) {
        const appointmentTimeNorm = appointment_time.substring(0, 5);

        if (isSlotBlocked(appointment_date, appointmentTimeNorm, blocks, 50)) {
          console.log('⚠️ Time slot is blocked');
          return NextResponse.json(
            { error: 'Este horario no está disponible. Por favor elige otro horario.' },
            { status: 400 }
          );
        }
      }

      // Determinar ubicación basada en el tipo de cita
      const { data: professionalData } = await supabase
        .from('professional_applications')
        .select('address, city, state')
        .eq('id', professional_id)
        .single();

      const location = appointment_type === 'online'
        ? 'Consulta en línea'
        : professionalData?.address || 'Por definir';

      console.log('📍 Location determined:', location);

      // Crear la cita
      const appointmentData = {
        patient_id: user.id,
        professional_id: professional_id,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        duration_minutes: 50,
        appointment_type: appointment_type,
        status: 'pending',
        cost: service_amount,
        location: location,
        notes: notes || null
      };

      console.log('💾 Inserting appointment:', appointmentData);

      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (createError || !newAppointment) {
        console.error('❌ Error creating appointment:', createError);
        const code = createError?.code;
        if (code === '23505') {
          return NextResponse.json(
            { error: 'Este horario ya no está disponible. Por favor elige otro horario.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `Error al crear la cita: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      console.log('✅ Appointment created:', newAppointment.id);
      appointmentId = newAppointment.id;
    }

    // Check if appointment already has a payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'succeeded')
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Esta cita ya tiene un pago confirmado' },
        { status: 400 }
      );
    }

    // Get professional information including Stripe account
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('first_name, last_name, profession, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', professional_id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Check if professional has Stripe Connect enabled
    if (!professional.stripe_account_id) {
      console.error('❌ Professional does not have Stripe account configured:', professional_id);
      return NextResponse.json(
        { 
          error: 'El profesional aún no ha configurado su cuenta de pagos. Por favor, contacta al profesional o intenta con otro experto.',
          code: 'STRIPE_NOT_CONFIGURED'
        },
        { status: 400 }
      );
    }

    if (!professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      console.error('❌ Professional Stripe account not fully configured:', {
        professional_id,
        charges_enabled: professional.stripe_charges_enabled,
        payouts_enabled: professional.stripe_payouts_enabled
      });
      return NextResponse.json(
        { 
          error: 'La cuenta de pagos del profesional está en proceso de configuración. Por favor, intenta más tarde o contacta al profesional.',
          code: 'STRIPE_INCOMPLETE'
        },
        { status: 400 }
      );
    }

    // Calculate commission (15% for professionals) and transfer amount
    const platformFee = calculateCommission(service_amount, 15);
    const transferAmount = calculateTransferAmount(service_amount, 15);

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        service_amount,
        amount: service_amount, // Total amount charged to customer
        commission_percentage: 15,
        platform_fee: platformFee, // Platform commission
        transfer_amount: transferAmount, // Amount to be transferred to professional
        currency: 'mxn',
        status: 'pending',
        patient_id: user.id,
        professional_id,
        description: description || `Reserva de consulta con ${professional.first_name} ${professional.last_name}`,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        { error: 'Error al crear registro de pago' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session with Connect (platform charges, transfers to professional)
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            unit_amount: formatAmountForStripe(service_amount), // Charge full amount to customer
            product_data: {
              name: 'Reserva de Consulta - Holistia',
              description: `${professional.profession}: ${professional.first_name} ${professional.last_name}`,
              images: ['https://via.placeholder.com/300x200?text=Holistia'], // Replace with your logo
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: formatAmountForStripe(platformFee), // Platform takes 15%
        transfer_data: {
          destination: professional.stripe_account_id, // Transfer rest to professional
        },
      },
      metadata: {
        appointment_id: appointmentId,
        payment_id: payment.id,
        patient_id: user.id,
        professional_id,
        service_amount: service_amount.toString(),
        platform_fee: platformFee.toString(),
        transfer_amount: transferAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/appointments/confirmation?appointment_id=${appointmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/explore/appointments?cancelled=1`,
      customer_email: user.email,
    });

    // Update payment record with Stripe session ID
    await supabase
      .from('payments')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
        status: 'processing',
      })
      .eq('id', payment.id);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Error al crear sesión de pago',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

