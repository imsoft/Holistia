"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AppointmentActionForm } from "@/components/appointments/appointment-action-form";

export default function CancelAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const appointmentId = params.appointmentId as string;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/professional/${professionalId}/appointments`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Cancelar Cita</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <AppointmentActionForm
            appointmentId={appointmentId}
            actionType="cancel"
            userRole="professional"
            redirectPath={`/professional/${professionalId}/appointments`}
          />
        </div>
      </div>
    </div>
  );
}
