"use client";

import { useState } from "react";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EventWaitlistButtonProps {
  eventId: string;
  className?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg";
  children?: React.ReactNode;
}

export function EventWaitlistButton({
  eventId,
  className,
  variant = "secondary",
  size = "default",
  children,
}: EventWaitlistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "No se pudo apuntarte a la lista de espera");
        return;
      }
      toast.success(data.message || "Te hemos añadido a la lista de espera");
      setJoined(true);
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn("cursor-default", className)}
        disabled
      >
        <ListPlus className="h-4 w-4 mr-2" />
        En la lista de espera
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleJoin}
      disabled={loading}
    >
      {loading ? (
        <span className="animate-pulse">Un momento...</span>
      ) : (
        <>
          <ListPlus className="h-4 w-4 mr-2" />
          {children ?? "Apuntarme a la lista de espera"}
        </>
      )}
    </Button>
  );
}
