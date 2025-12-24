import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// POST - Remover un miembro del equipo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();
    const { action, userId: targetUserId } = body;

    // Verificar que el usuario actual es el creador del equipo
    const { data: team, error: teamError } = await supabase
      .from("challenge_teams")
      .select("creator_id, challenge_id")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    const isCreator = team.creator_id === user.id;

    switch (action) {
      case "remove_member": {
        // Solo el creador puede remover miembros
        if (!isCreator) {
          return NextResponse.json(
            { error: "Solo el creador puede remover miembros" },
            { status: 403 }
          );
        }

        if (!targetUserId) {
          return NextResponse.json(
            { error: "userId es requerido" },
            { status: 400 }
          );
        }

        // No puede removerse a sí mismo (debe usar leave)
        if (targetUserId === user.id) {
          return NextResponse.json(
            { error: "No puedes removerte a ti mismo. Usa la acción de salir del equipo." },
            { status: 400 }
          );
        }

        // Remover al miembro
        const { error: removeError } = await supabase
          .from("challenge_team_members")
          .delete()
          .eq("team_id", teamId)
          .eq("user_id", targetUserId);

        if (removeError) {
          console.error("Error removing member:", removeError);
          return NextResponse.json(
            { error: "Error al remover miembro" },
            { status: 500 }
          );
        }

        // Actualizar is_full
        const { data: memberCount } = await supabase
          .from("challenge_team_members")
          .select("id", { count: "exact" })
          .eq("team_id", teamId);

        const { data: teamData } = await supabase
          .from("challenge_teams")
          .select("max_members")
          .eq("id", teamId)
          .single();

        if (teamData && memberCount) {
          const isFull = memberCount.length >= teamData.max_members;
          await supabase
            .from("challenge_teams")
            .update({ is_full: isFull })
            .eq("id", teamId);
        }

        // Crear notificación para el usuario removido
        const { data: teamInfo } = await supabase
          .from("challenge_teams")
          .select("team_name")
          .eq("id", teamId)
          .single();

        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "team_member_left",
          title: "Removido del equipo",
          message: `Fuiste removido del equipo "${teamInfo?.team_name}"`,
          action_url: `/patient/${targetUserId}/challenges`,
        });

        return NextResponse.json({
          success: true,
          message: "Miembro removido exitosamente",
        });
      }

      case "transfer_leadership": {
        // Solo el creador puede transferir liderazgo
        if (!isCreator) {
          return NextResponse.json(
            { error: "Solo el creador puede transferir el liderazgo" },
            { status: 403 }
          );
        }

        if (!targetUserId) {
          return NextResponse.json(
            { error: "userId es requerido" },
            { status: 400 }
          );
        }

        // Verificar que el nuevo líder es miembro del equipo
        const { data: membership } = await supabase
          .from("challenge_team_members")
          .select("id")
          .eq("team_id", teamId)
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (!membership) {
          return NextResponse.json(
            { error: "El usuario no es miembro del equipo" },
            { status: 400 }
          );
        }

        // Transferir liderazgo
        const { error: transferError } = await supabase
          .from("challenge_teams")
          .update({ creator_id: targetUserId })
          .eq("id", teamId);

        if (transferError) {
          console.error("Error transferring leadership:", transferError);
          return NextResponse.json(
            { error: "Error al transferir liderazgo" },
            { status: 500 }
          );
        }

        // Crear notificación para el nuevo líder
        const { data: teamInfo } = await supabase
          .from("challenge_teams")
          .select("team_name")
          .eq("id", teamId)
          .single();

        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "team_member_joined",
          title: "Eres el nuevo líder",
          message: `Ahora eres el líder del equipo "${teamInfo?.team_name}"`,
          action_url: `/patient/${targetUserId}/teams/${teamId}`,
        });

        return NextResponse.json({
          success: true,
          message: "Liderazgo transferido exitosamente",
        });
      }

      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in team management:", error);
    return NextResponse.json(
      { error: "Error al gestionar equipo" },
      { status: 500 }
    );
  }
}

// DELETE - Salir del equipo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { teamId } = await params;

    // Verificar que el usuario es miembro del equipo
    const { data: membership } = await supabase
      .from("challenge_team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    // Verificar si es el creador
    const { data: team } = await supabase
      .from("challenge_teams")
      .select("creator_id, team_name")
      .eq("id", teamId)
      .single();

    if (team?.creator_id === user.id) {
      // Contar miembros restantes
      const { data: members } = await supabase
        .from("challenge_team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .neq("user_id", user.id);

      if (members && members.length > 0) {
        return NextResponse.json(
          {
            error: "Como líder, debes transferir el liderazgo antes de salir del equipo",
            requiresTransfer: true,
            members: members.map(m => m.user_id),
          },
          { status: 400 }
        );
      }

      // Si no hay más miembros, eliminar el equipo completo
      const { error: deleteTeamError } = await supabase
        .from("challenge_teams")
        .delete()
        .eq("id", teamId);

      if (deleteTeamError) {
        console.error("Error deleting team:", deleteTeamError);
        return NextResponse.json(
          { error: "Error al eliminar equipo" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Equipo eliminado exitosamente",
        teamDeleted: true,
      });
    }

    // Si no es creador, simplemente salir
    const { error: leaveError } = await supabase
      .from("challenge_team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", user.id);

    if (leaveError) {
      console.error("Error leaving team:", leaveError);
      return NextResponse.json(
        { error: "Error al salir del equipo" },
        { status: 500 }
      );
    }

    // Actualizar is_full
    const { data: memberCount } = await supabase
      .from("challenge_team_members")
      .select("id", { count: "exact" })
      .eq("team_id", teamId);

    const { data: teamData } = await supabase
      .from("challenge_teams")
      .select("max_members")
      .eq("id", teamId)
      .single();

    if (teamData && memberCount) {
      const isFull = memberCount.length >= teamData.max_members;
      await supabase
        .from("challenge_teams")
        .update({ is_full: isFull })
        .eq("id", teamId);
    }

    // Notificar al creador
    if (team) {
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: team.creator_id,
        type: "team_member_left",
        title: "Un miembro salió del equipo",
        message: `${creatorProfile?.first_name} ${creatorProfile?.last_name} salió del equipo "${team.team_name}"`,
        action_url: `/patient/${team.creator_id}/teams/${teamId}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Saliste del equipo exitosamente",
    });
  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Error al salir del equipo" },
      { status: 500 }
    );
  }
}
