"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const FullWidthDialog = DialogPrimitive.Root;

const FullWidthDialogTrigger = DialogPrimitive.Trigger;

const FullWidthDialogPortal = DialogPrimitive.Portal;

const FullWidthDialogClose = DialogPrimitive.Close;

const FullWidthDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
FullWidthDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const FullWidthDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <FullWidthDialogPortal>
    <FullWidthDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
        "w-[95vw] max-w-[1400px]", // Ancho controlado: 95% del viewport con máximo de 1400px
        "max-h-[90vh]", // Altura máxima del 90% del viewport
        "overflow-y-auto", // Scroll si es necesario
        "rounded-lg border bg-background shadow-lg",
        "duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </FullWidthDialogPortal>
));
FullWidthDialogContent.displayName = DialogPrimitive.Content.displayName;

const FullWidthDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left px-6 pt-6",
      className
    )}
    {...props}
  />
);
FullWidthDialogHeader.displayName = "FullWidthDialogHeader";

const FullWidthDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 pb-6",
      className
    )}
    {...props}
  />
);
FullWidthDialogFooter.displayName = "FullWidthDialogFooter";

const FullWidthDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
FullWidthDialogTitle.displayName = DialogPrimitive.Title.displayName;

const FullWidthDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
FullWidthDialogDescription.displayName =
  DialogPrimitive.Description.displayName;

export {
  FullWidthDialog,
  FullWidthDialogPortal,
  FullWidthDialogOverlay,
  FullWidthDialogClose,
  FullWidthDialogTrigger,
  FullWidthDialogContent,
  FullWidthDialogHeader,
  FullWidthDialogFooter,
  FullWidthDialogTitle,
  FullWidthDialogDescription,
};

