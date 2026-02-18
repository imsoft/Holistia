"use client";

import { WorkingHoursConfig } from "@/components/ui/working-hours-config";
import { toast } from "sonner";

interface AvailabilityTabProps {
  professionalId: string;
}

export function AvailabilityTab({ professionalId }: AvailabilityTabProps) {
  return (
    <WorkingHoursConfig
      professionalId={professionalId}
      onSave={() => toast.success("Disponibilidad actualizada exitosamente")}
    />
  );
}
