"use client";

import { type ComponentProps } from "react";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type EventShareButtonProps = ComponentProps<typeof Button> & {
  eventName: string;
  shareUrl: string;
};

export function EventShareButton({
  eventName,
  shareUrl,
  className,
  ...buttonProps
}: EventShareButtonProps) {
  const getShareMessage = () =>
    `¡Mira este evento en Holistia! "${eventName}" – te comparto el enlace: ${shareUrl}`;

  const handleWhatsAppShare = () => {
    const message = getShareMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying event link:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          {...buttonProps}
          className={cn("shadow-lg", className)}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleWhatsAppShare}>
          Compartir en WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          Copiar enlace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
