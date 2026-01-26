"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CopyUrlButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  urlPath: string;
}

export function CopyUrlButton({ urlPath, children, ...props }: CopyUrlButtonProps) {
  const handleCopy = async () => {
    try {
      const shareUrl = `${window.location.origin}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <Button {...props} onClick={handleCopy} type="button">
      {children}
    </Button>
  );
}

