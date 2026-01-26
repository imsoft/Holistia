import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendChallengeInvitationEmail } from "@/lib/email-sender";

// GET - Obtener invitaciones del usuario
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // received | sent

    let query = supabase
      .from("challenge_team_invitations")
      .select(`
        *,
        team:challenge_teams(
          id,
          team_name,
          max_members,
          is_full,
          creator_id,
          challenge:challenges(id, title, cover_image_url)
        ),
        inviter:profiles!challenge_team_invitations_inviter_id_fkey(
          first_name,
          last_name,
          avatar_url
        ),
        invitee:profiles!challenge_team_invitations_invitee_id_fkey(
          first_name,
          last_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (type === "received") {
      query = query.eq("invitee_id", user.id).eq("status", "pending");
    } else {
      query = query.eq("inviter_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener información del creador del equipo por separado si es necesario
    const enrichedData = await Promise.all(
      (data || []).map(async (invitation: any) => {
        if (invitation.team?.creator_id) {
          const { data: creator } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", invitation.team.creator_id)
            .single();

          return {
            ...invitation,
            team: {
              ...invitation.team,
              creator: creator || null,
            },
          };
        }
        return invitation;
      })
    );

    return NextResponse.json({ data: enrichedData || [] });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Error al obtener invitaciones" }, { status: 500 });
  }
}

// POST - Crear invitación
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { teamId, inviteeId } = await request.json();

    if (!teamId || !inviteeId) {
      return NextResponse.json(
        { error: "teamId y inviteeId son requeridos" },
        { status: 400 }
      );
    }

    // La validación de seguimiento, compra del reto, etc. se hace en el trigger de la BD
    const { data: invitation, error: invitationError } = await supabase
      .from("challenge_team_invitations")
      .insert({
        team_id: teamId,
        inviter_id: user.id,
        invitee_id: inviteeId,
      })
      .select(`
        *,
        team:challenge_teams(
          id,
          team_name,
          challenge:challenges(id, title)
        ),
        inviter:profiles!challenge_team_invitations_inviter_id_fkey(first_name, last_name)
      `)
      .single();

    if (invitationError) {
      return NextResponse.json({ error: invitationError.message }, { status: 500 });
    }

    // Enviar email al invitado (no romper el flujo si falla)
    try {
      const { data: inviteeProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", inviteeId)
        .single();

      const inviteeEmail = inviteeProfile?.email;
      if (inviteeEmail) {
        const inviteeName =
          [inviteeProfile?.first_name, inviteeProfile?.last_name].filter(Boolean).join(" ").trim() ||
          inviteeEmail.split("@")[0] ||
          "Usuario";

        const inviterName =
          [invitation?.inviter?.first_name, invitation?.inviter?.last_name].filter(Boolean).join(" ").trim() ||
          user.email?.split("@")[0] ||
          "Usuario";

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://holistia.io";
        const challengeUrl = `${siteUrl}/my-challenges`;

        await sendChallengeInvitationEmail({
          recipient_name: inviteeName,
          recipient_email: inviteeEmail,
          inviter_name: inviterName,
          challenge_title: invitation?.team?.challenge?.title || "Reto",
          challenge_url: challengeUrl,
          action: "invited",
        });
      }
    } catch (emailError) {
      console.error("Error sending challenge invitation email:", emailError);
    }

    return NextResponse.json({ data: invitation });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Error al crear invitación" }, { status: 500 });
  }
}

// PATCH - Actualizar invitación (aceptar/rechazar)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { invitationId, action } = await request.json();

    if (!invitationId || !action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "invitationId y action (accept/reject) son requeridos" },
        { status: 400 }
      );
    }

    // Obtener la invitación
    const { data: invitation, error: getError } = await supabase
      .from("challenge_team_invitations")
      .select(`
        *,
        team:challenge_teams(id, challenge_id, is_full)
      `)
      .eq("id", invitationId)
      .eq("invitee_id", user.id)
      .eq("status", "pending")
      .single();

    if (getError || !invitation) {
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 }
      );
    }

    if (action === "accept") {
      // Verificar que el equipo no esté lleno
      if (invitation.team.is_full) {
        return NextResponse.json(
          { error: "El equipo está lleno" },
          { status: 400 }
        );
      }

      // Obtener la compra del usuario para este reto
      const { data: purchase } = await supabase
        .from("challenge_purchases")
        .select("id")
        .eq("participant_id", user.id)
        .eq("challenge_id", invitation.team.challenge_id)
        .maybeSingle();

      if (!purchase) {
        return NextResponse.json(
          { error: "Debes comprar el reto primero" },
          { status: 400 }
        );
      }

      // Agregar al usuario al equipo
      const { error: memberError } = await supabase
        .from("challenge_team_members")
        .insert({
          team_id: invitation.team.id,
          user_id: user.id,
          challenge_purchase_id: purchase.id,
        });

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      // Actualizar la compra para marcarla como equipo
      await supabase
        .from("challenge_purchases")
        .update({
          is_team_challenge: true,
          team_id: invitation.team.id,
        })
        .eq("id", purchase.id);
    }

    // Actualizar estado de la invitación
    const { data: updatedInvitation, error: updateError } = await supabase
      .from("challenge_team_invitations")
      .update({
        status: action === "accept" ? "accepted" : "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updatedInvitation });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json({ error: "Error al actualizar invitación" }, { status: 500 });
  }
}

// DELETE - Cancelar invitación
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId es requerido" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("challenge_team_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("inviter_id", user.id)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Error al cancelar invitación" }, { status: 500 });
  }
}
