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
    console.log('🔵 BookingDialog useEffect - open:', open);
    if (open) {
      document.body.classList.add('booking-dialog-open');
      console.log('🔵 Clase booking-dialog-open agregada al body');
    } else {
      document.body.classList.remove('booking-dialog-open');
      console.log('🔵 Clase booking-dialog-open removida del body');
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('booking-dialog-open');
    };
  }, [open]);

  console.log('🔵 BookingDialog render - open:', open);
  if (!open) {
    console.log('🔵 BookingDialog no renderizado porque open es false');
    return null;
  }
  
  console.log('🔵 BookingDialog renderizando modal');

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={() => {
          console.log('🔵 Backdrop click - cerrando modal');
          onOpenChange(false);
        }}
      />

      {/* Dialog */}
      <div 
        className="relative bg-background rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-border w-full sm:w-[98vw] max-w-7xl h-full sm:h-auto sm:max-h-[95vh] overflow-hidden z-[9999] flex flex-col"
        style={{
          position: 'relative',
          zIndex: 9999,
          backgroundColor: 'var(--background)',
          pointerEvents: 'auto'
        }}
      >
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
