"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageUrl,
  alt = "Imagen ampliada",
}: ImageViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none"
        showCloseButton={true}
      >
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={alt}
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
              unoptimized
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
