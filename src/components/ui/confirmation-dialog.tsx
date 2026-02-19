"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Edit, Info, Trash2, LogOut } from "lucide-react";
import { ReactNode } from "react";

export type ConfirmationVariant = "danger" | "warning" | "info";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: ReactNode;
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: "text-destructive",
    confirmClass: "bg-destructive text-white hover:bg-destructive/90",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    confirmClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    confirmClass: "",
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  icon,
  loading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = icon ? () => icon : config.icon;
  const normalizedConfirmText = confirmText.trim().toLowerCase();
  const isIconOnlyAction = !loading && (normalizedConfirmText === "eliminar" || normalizedConfirmText === "editar");
  const ActionIcon = normalizedConfirmText === "editar" ? Edit : Trash2;

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className={`${config.iconColor} mt-0.5`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={`${config.confirmClass} ${isIconOnlyAction ? "h-9 w-9 p-0" : ""}`.trim()}
            aria-label={confirmText}
          >
            {loading ? "Procesando..." : isIconOnlyAction ? (
              <>
                <ActionIcon className="h-4 w-4" />
                <span className="sr-only">{confirmText}</span>
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Versiones pre-configuradas para casos comunes

interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  itemName: string;
  loading?: boolean;
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  loading,
}: DeleteConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="¿Eliminar elemento?"
      description={`¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`}
      confirmText="Eliminar"
      variant="danger"
      loading={loading}
    />
  );
}

interface LeaveTeamConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  teamName: string;
  loading?: boolean;
}

export function LeaveTeamConfirmation({
  open,
  onOpenChange,
  onConfirm,
  teamName,
  loading,
}: LeaveTeamConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="¿Salir del equipo?"
      description={`¿Estás seguro de que deseas salir de "${teamName}"? Perderás acceso al chat y progreso del equipo.`}
      confirmText="Salir del equipo"
      variant="warning"
      icon={<LogOut className="h-5 w-5" />}
      loading={loading}
    />
  );
}
