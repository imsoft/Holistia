"use client";

import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FriendlyErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function FriendlyErrorDialog({
  open,
  onOpenChange,
  title,
  message,
  type = 'error',
  description,
  actionText = 'Entendido',
  onAction
}: FriendlyErrorDialogProps) {
  if (!open) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-6 w-6 text-amber-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-amber-600" />;
    }
  };

  const getCardStyles = () => {
    switch (type) {
      case 'error':
        return 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50';
      case 'warning':
        return 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50';
      case 'info':
        return 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50';
      case 'success':
        return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50';
      default:
        return 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-amber-800';
      case 'warning':
        return 'text-orange-800';
      case 'info':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      default:
        return 'text-amber-800';
    }
  };

  const handleAction = () => {
    onAction?.();
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-9998"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <Card className={`relative w-full max-w-md shadow-2xl border-2 ${getCardStyles()} z-9999`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getIcon()}
              <h3 className={`text-lg font-semibold ${getTextColor()}`}>
                {title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 hover:bg-white/50 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Message */}
          <div className="mb-6">
            <p className={`text-sm leading-relaxed ${getTextColor()}`}>
              {message}
            </p>
            {description && (
              <p className={`text-xs mt-2 opacity-80 ${getTextColor()}`}>
                {description}
              </p>
            )}
          </div>
          
          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleAction}
              className={`${
                type === 'error' 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : type === 'warning'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : type === 'info'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } px-6 py-2 rounded-lg font-medium transition-colors`}
            >
              {actionText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
