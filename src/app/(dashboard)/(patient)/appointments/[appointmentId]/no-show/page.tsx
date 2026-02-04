"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppointmentActionForm } from "@/components/appointments/appointment-action-form";
import { createClient } from "@/utils/supabase/client";

type Role = "patient" | "professional";

function getRedirectPath(role: Role) {
  return role === "professional" ? "/appointments" : "/explore/appointments";
}

export default function NoShowAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveRole = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data: appointment } = await supabase
      .from("appointments")
      .select("patient_id, professional_id")
      .eq("id", appointmentId)
      .single();
    if (!appointment) {
      setUserRole("patient");
      setLoading(false);
      return;
    }
    if (appointment.patient_id === user.id) {
      setUserRole("patient");
    } else {
      const { data: prof } = await supabase
        .from("professional_applications")
        .select("user_id")
        .eq("id", appointment.professional_id)
        .single();
      setUserRole(prof?.user_id === user.id ? "professional" : "patient");
    }
    setLoading(false);
  }, [appointmentId, router]);

  useEffect(() => {
    resolveRole();
  }, [resolveRole]);

  const redirectPath = userRole ? getRedirectPath(userRole) : "/explore/appointments";

  if (loading || userRole === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(redirectPath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {userRole === "professional" ? "Marcar paciente no asistió" : "Marcar inasistencia"}
          </h1>
        </div>
      </div>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <AppointmentActionForm
            appointmentId={appointmentId}
            actionType="no-show"
            userRole={userRole}
            redirectPath={redirectPath}
          />
        </div>
      </div>
    </div>
  );
}
