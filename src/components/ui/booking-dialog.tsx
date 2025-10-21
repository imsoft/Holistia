"use client";

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/booking-dialog.css';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title: string;
}

export function BookingDialog({ open, onOpenChange, children, title }: BookingDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('booking-dialog-open');
    } else {
      document.body.classList.remove('booking-dialog-open');
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('booking-dialog-open');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-border w-full sm:w-[95vw] max-w-6xl h-full sm:h-auto sm:max-h-[95vh] overflow-hidden z-[9999] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - con padding bottom extra en móviles para los botones sticky */}
        <div className="overflow-y-auto flex-1 pb-32 sm:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
