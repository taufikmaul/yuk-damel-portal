import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./alert-dialog";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  isLoading?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "default",
  isLoading = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case "destructive":
        return <AlertCircle className="size-5 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="size-5 text-amber-500" />;
      case "success":
        return <CheckCircle className="size-5 text-emerald-600" />;
      default:
        return <Info className="size-5 text-[#a9484c]" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="flex flex-row items-start gap-3">
          <div
            className={cn(
              "shrink-0 p-2 rounded-xl border",
              variant === "destructive" && "bg-rose-50 border-rose-200",
              variant === "warning" && "bg-amber-50 border-amber-200",
              variant === "success" && "bg-emerald-50 border-emerald-200",
              variant === "default" && "bg-slate-50 border-slate-200"
            )}
          >
            {getIcon()}
          </div>
          <div className="space-y-1 text-left">
            <AlertDialogTitle className="text-base font-semibold text-slate-900">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-sm text-slate-500 leading-relaxed">
                {description}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={getButtonVariant()}
            disabled={isLoading}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {isLoading ? "Memproses..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
