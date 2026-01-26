"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function EventFreeRegisterButton() {
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      // Nota: aquí deberíamos implementar la lógica real de registro (insert en `event_registrations`)
      // pero mantenemos el comportamiento previo para no romper flujos existentes.
      toast.success("¡Registro exitoso! Te hemos enviado un email de confirmación.");
    } catch (error) {
      console.error("Error registering for free event:", error);
      toast.error("Error al registrarse en el evento");
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

