"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface EventFreeRegisterButtonProps {
  eventId: string;
}

export function EventFreeRegisterButton({ eventId }: EventFreeRegisterButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!eventId) {
      toast.error("Error: falta el ID del evento");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/events/free-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error ?? "Error al registrarse en el evento";
        toast.error(msg);
        return;
      }

      toast.success(
        "¡Registro confirmado! Revisa tu email con los detalles y el código de confirmación."
      );
      router.refresh();
    } catch (error) {
      console.error("Error registering for free event:", error);
      toast.error("Error al registrarse en el evento. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full text-sm sm:text-base touch-manipulation"
      size="lg"
      onClick={handleRegister}
      disabled={loading}
      type="button"
    >
      {loading ? "Registrando..." : "Registrarse al evento"}
    </Button>
  );
}

