import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendChallengeInvitationEmail } from "@/lib/email-sender";

// GET - Buscar usuarios de toda la plataforma para invitar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el reto existe y el usuario es participante
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id, title")
      .eq("id", challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json(
        { error: "Reto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es participante del reto
    const { data: participation } = await supabase
      .from("challenge_purchases")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("participant_id", user.id)
      .maybeSingle();

    if (!participation) {
      return NextResponse.json(
        { error: "Debes ser participante del reto para invitar usuarios" },
        { status: 403 }
      );
    }

    // Obtener participantes actuales del reto
    const { data: currentParticipants } = await supabase
      .from("challenge_purchases")
      .select("participant_id")
      .eq("challenge_id", challengeId);

    const participantIds = currentParticipants?.map((p) => p.participant_id) || [];
    const excludeIds = [...participantIds, user.id]; // Excluir participantes actuales y el usuario actual

    // Buscar usuarios de toda la plataforma
    let usersQuery = supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, email, type")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .eq("account_active", true)
      .limit(limit);

    // Si hay query, buscar por nombre o email
    if (query.length >= 2) {
      usersQuery = usersQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
      );
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error("Error searching users:", usersError);
      return NextResponse.json(
        { error: "Error al buscar usuarios" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: users || [],
      count: users?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/challenges/[id]/invite-users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Invitar usuarios al reto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;
    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: "user_ids es requerido y debe ser un array no vacío" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el reto existe (incl. price para retos de pago)
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id, title, created_by_user_id, price, currency")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: "Reto no encontrado" },
        { status: 404 }
      );
    }

    const challengePrice = challenge.price != null ? Number(challenge.price) : 0;
    const hasPrice = challengePrice > 0;

    // Verificar que el usuario es participante del reto
    const { data: participation } = await supabase
      .from("challenge_purchases")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("participant_id", user.id)
      .maybeSingle();

    if (!participation) {
      return NextResponse.json(
        { error: "Debes ser participante del reto para invitar usuarios" },
        { status: 403 }
      );
    }

    // Obtener participantes actuales del reto
    const { data: currentParticipants } = await supabase
      .from("challenge_purchases")
      .select("participant_id")
      .eq("challenge_id", challengeId);

    const currentCount = currentParticipants?.length || 0;
    const maxParticipants = 5;
    const minParticipants = 2;

    // Verificar límite máximo (5 participantes)
    if (currentCount + user_ids.length > maxParticipants) {
      return NextResponse.json(
        {
          error: `El reto puede tener máximo ${maxParticipants} participantes. Actualmente hay ${currentCount} y estás intentando agregar ${user_ids.length}`,
        },
        { status: 400 }
      );
    }

    // Verificar que los usuarios existen y están activos
    const { data: usersToInvite, error: usersError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, account_active")
      .in("id", user_ids)
      .eq("account_active", true);

    if (usersError || !usersToInvite || usersToInvite.length === 0) {
      return NextResponse.json(
        { error: "Uno o más usuarios no existen o no están activos" },
        { status: 400 }
      );
    }

    // Verificar que los usuarios no están ya participando
    const existingParticipantIds = new Set(
      currentParticipants?.map((p) => p.participant_id) || []
    );

    const newUserIds = usersToInvite
      .map((u) => u.id)
      .filter((id) => !existingParticipantIds.has(id));

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { error: "Todos los usuarios ya están participando en el reto" },
        { status: 400 }
      );
    }

    // Crear participaciones (challenge_purchases). Si el reto tiene precio, access_granted = false hasta que paguen.
    const newPurchases = newUserIds.map((userId) => {
      const base = {
        challenge_id: challengeId,
        participant_id: userId,
        started_at: hasPrice ? null : new Date().toISOString(),
      };
      if (hasPrice) {
        return {
          ...base,
          access_granted: false,
          amount: challengePrice,
          currency: challenge.currency || "MXN",
          payment_status: "pending",
        };
      }
      return { ...base, access_granted: true };
    });

    const { data: createdPurchases, error: purchaseError } = await supabase
      .from("challenge_purchases")
      .insert(newPurchases)
      .select();

    if (purchaseError || !createdPurchases) {
      console.error("Error creating purchases:", purchaseError);
      return NextResponse.json(
        { error: "Error al agregar participantes al reto" },
        { status: 500 }
      );
    }

    // Verificar si ahora hay mínimo 2 participantes (para considerar equipo)
    const finalCount = currentCount + createdPurchases.length;
    const isTeamChallenge = finalCount >= minParticipants;

    // Obtener información del invitador
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    const inviterName =
      [inviterProfile?.first_name, inviterProfile?.last_name]
        .filter(Boolean)
        .join(" ") ||
      inviterProfile?.email?.split("@")[0] ||
      "Usuario";

    // Enviar emails de invitación (si tiene precio, incluir URL de pago)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.holistia.io";
    const challengeUrl = `${siteUrl}/my-challenges?challenge=${challengeId}`;
    const paymentUrl = hasPrice
      ? `${siteUrl}/explore/challenge/${challengeId}/checkout`
      : undefined;
    const currency = challenge.currency || "MXN";
    const challengePriceFormatted = hasPrice
      ? new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: currency,
        }).format(challengePrice)
      : undefined;

    await Promise.allSettled(
      usersToInvite
        .filter((u) => newUserIds.includes(u.id))
        .map((recipient) => {
          const recipientName =
            [recipient.first_name, recipient.last_name]
              .filter(Boolean)
              .join(" ") ||
            recipient.email?.split("@")[0] ||
            "Usuario";

          return sendChallengeInvitationEmail({
            recipient_name: recipientName,
            recipient_email: recipient.email || "",
            inviter_name: inviterName,
            challenge_title: challenge.title || "Reto",
            challenge_url: challengeUrl,
            action: "invited",
            payment_url: paymentUrl,
            challenge_price: challengePriceFormatted,
          });
        })
    );

    return NextResponse.json({
      success: true,
      message: `${createdPurchases.length} usuario(s) invitado(s) exitosamente`,
      added: createdPurchases.length,
      total_participants: finalCount,
      is_team_challenge: isTeamChallenge,
      purchases: createdPurchases,
    });
  } catch (error) {
    console.error("Error in POST /api/challenges/[id]/invite-users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
