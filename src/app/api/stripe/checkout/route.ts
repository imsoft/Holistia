import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

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

      // Verificar que el horario no esté bloqueado (bloques manuales, Google Calendar, etc.)
      // Lógica alineada con useScheduleAvailability (client-side) para consistencia
      console.log('🔍 Checking for availability blocks...');
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professional_id);

      if (blocks && blocks.length > 0) {
        // Parsear fecha de forma segura (evitar UTC con new Date(string))
        const [year, month, day] = appointment_date.split('-').map(Number);
        const appointmentDateObj = new Date(year, month - 1, day);
        appointmentDateObj.setHours(0, 0, 0, 0);
        const dayOfWeek = appointmentDateObj.getDay() === 0 ? 7 : appointmentDateObj.getDay();

        // Helper: normalizar día de la semana (JS 0=Dom → nuestro 7=Dom)
        const normalizeDayOfWeek = (jsDay: number) => (jsDay === 0 ? 7 : jsDay);

        // Helper: verificar si un día está en un rango semanal (soporta wrap-around, ej. Vie-Mar = 5-2)
        const isDayOfWeekInRange = (d: number, start: number, end: number) => {
          if (start <= end) return d >= start && d <= end;
          return d >= start || d <= end;
        };

        // Helper: parsear fecha YYYY-MM-DD sin problemas de zona horaria
        const parseDate = (dateStr: string) => {
          const [y, m, d] = dateStr.split('-').map(Number);
          return new Date(y, m - 1, d);
        };

        // Normalizar appointment_time a formato HH:MM
        const appointmentTimeNorm = appointment_time.substring(0, 5);

        // Verificar si hay algún bloqueo que aplique a esta fecha/hora
        const isBlocked = blocks.some(block => {
          const blockStartDate = parseDate(block.start_date);
          const blockEndDate = block.end_date ? parseDate(block.end_date) : new Date(blockStartDate);
          blockStartDate.setHours(0, 0, 0, 0);
          blockEndDate.setHours(0, 0, 0, 0);

          const isInDateRange = appointmentDateObj >= blockStartDate && appointmentDateObj <= blockEndDate;
          const dayOfWeekStart = normalizeDayOfWeek(blockStartDate.getDay());
          const dayOfWeekEnd = normalizeDayOfWeek(blockEndDate.getDay());

          // --- Fase 1: Determinar si este bloque aplica a la fecha de la cita ---
          let appliesToDate = false;

          if (block.block_type === 'weekly_day') {
            // Bloqueo semanal de día completo
            const matchesDayOfWeek = block.day_of_week === dayOfWeek;
            if (block.is_recurring) {
              appliesToDate = matchesDayOfWeek;
            } else {
              // No recurrente: solo aplica a la fecha exacta de start_date
              appliesToDate = matchesDayOfWeek && block.start_date === appointment_date;
            }
          } else if (block.block_type === 'weekly_range') {
            // Bloqueo semanal de rango de horas
            let isInWeekRange: boolean;
            if (block.day_of_week != null) {
              isInWeekRange = dayOfWeek === block.day_of_week;
            } else {
              isInWeekRange = isDayOfWeekInRange(dayOfWeek, dayOfWeekStart, dayOfWeekEnd);
            }
            appliesToDate = block.is_recurring ? isInWeekRange : (isInWeekRange && isInDateRange);
          } else if (block.block_type === 'full_day') {
            // Bloqueo de día completo (legacy)
            if (block.is_recurring) {
              appliesToDate = isDayOfWeekInRange(dayOfWeek, dayOfWeekStart, dayOfWeekEnd);
            } else {
              appliesToDate = isInDateRange;
            }
          } else if (block.block_type === 'time_range') {
            // Bloqueo de rango de tiempo (legacy / Google Calendar)
            if (block.is_recurring) {
              appliesToDate = isDayOfWeekInRange(dayOfWeek, dayOfWeekStart, dayOfWeekEnd);
            } else {
              appliesToDate = isInDateRange;
            }
          }

          if (!appliesToDate) return false;

          // --- Fase 2: Determinar si cubre el horario de la cita ---
          // Bloqueo de día completo (sin start_time/end_time)
          if ((block.block_type === 'full_day' || block.block_type === 'weekly_day') &&
              !block.start_time && !block.end_time) {
            return true;
          }

          // Bloqueo con rango de horas
          if (block.start_time && block.end_time) {
            const blockStart = block.start_time.substring(0, 5);
            const blockEnd = block.end_time.substring(0, 5);
            return appointmentTimeNorm >= blockStart && appointmentTimeNorm < blockEnd;
          }

          return false;
        });

        if (isBlocked) {
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
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/explore/appointments`,
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

