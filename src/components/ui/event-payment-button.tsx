"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EventPaymentButtonProps {
  eventId: string;
  serviceAmount: number;
  eventName: string;
  eventDate: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function EventPaymentButton({
  eventId,
  serviceAmount,
  eventName,
  eventDate,
  onSuccess,
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
        window.location.href = data.url;
        onSuccess?.();
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
    <div className="space-y-4">
      <Button 
        className={`w-full ${className || ''}`}
        size="lg"
        onClick={handlePayment}
        disabled={loading || disabled}
      >
        {loading ? "Procesando..." : "Registrarse al evento"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Al registrarte, serás redirigido a Stripe para completar el pago de forma segura.
        Recibirás un email de confirmación una vez completado el pago.
      </p>
    </div>
  );
}
