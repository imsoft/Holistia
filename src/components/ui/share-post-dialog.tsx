"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SharePostDialogProps {
  checkinId: string;
  challengeTitle: string;
  userName: string;
  compact?: boolean;
}

export function SharePostDialog({
  checkinId,
  challengeTitle,
  userName,
  compact = false,
}: SharePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Construir URL para compartir
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/feed/post/${checkinId}`
    : '';

  const shareText = `${userName} completó un día del reto "${challengeTitle}" en Holistia`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar el enlace");
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challengeTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // Usuario canceló el compartir
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={cn(
            "gap-2",
            compact && "h-8 px-2"
          )}
        >
          <Share2 className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
          {!compact && <span>Compartir</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir publicación</DialogTitle>
          <DialogDescription>
            Comparte esta publicación con tus amigos
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Compartir nativo (móvil) */}
          {typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined' && (
            <Button
              onClick={handleShareNative}
              className="w-full gap-2"
              variant="default"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
          )}

          {/* Redes sociales */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShareFacebook}
              variant="outline"
              className="gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              onClick={handleShareTwitter}
              variant="outline"
              className="gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
          </div>

          {/* Copiar enlace */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
