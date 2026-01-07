"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RescheduleAppointmentForm } from "@/components/appointments/reschedule-appointment-form";

export default function RescheduleAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const appointmentId = params.appointmentId as string;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Reprogramar Cita
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecciona la nueva fecha y hora para tu cita
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <RescheduleAppointmentForm
            appointmentId={appointmentId}
            userRole="patient"
            redirectPath={`/patient/${patientId}/explore/appointments`}
          />
        </div>
      </div>
    </div>
  );
}
