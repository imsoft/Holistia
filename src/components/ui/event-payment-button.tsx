"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EventPaymentButtonProps {
  eventId: string;
  serviceAmount: number;
  eventName: string;
  eventDate: string;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function EventPaymentButton({
  eventId,
  serviceAmount,
  onError,
  className,
  disabled = false,
}: EventPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create checkout session
      const response = await fetch("/api/stripe/event-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          service_amount: serviceAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear sesión de pago");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        // No llamar onSuccess aquí - solo redirigir a Stripe
        // El éxito se manejará después del pago exitoso mediante webhook
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar el pago";
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-2">
      <Button
        className={`w-full touch-manipulation ${className || ''}`}
        size="lg"
        onClick={handlePayment}
        disabled={loading || disabled}
        type="button"
      >
        {loading ? "Procesando..." : "Registrarse al evento"}
      </Button>
      <p className="text-xs text-destructive font-semibold text-center">
        ⚠️ No hay reembolsos
      </p>
    </div>
  );
}
