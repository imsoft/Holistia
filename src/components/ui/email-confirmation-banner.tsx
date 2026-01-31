'use client';

import { useState, useEffect } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface EmailConfirmationBannerProps {
  userEmail?: string;
}

export function EmailConfirmationBanner({ userEmail }: EmailConfirmationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState(userEmail || '');

  useEffect(() => {
    // Verificar si el usuario necesita confirmar su email
    const checkEmailConfirmation = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || '');
        // Mostrar banner si el email no está confirmado
        if (!user.email_confirmed_at) {
          // Verificar si el usuario no ha cerrado el banner recientemente
          const dismissed = localStorage.getItem('email-banner-dismissed');
          if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
            setIsVisible(true);
          }
        }
      }
    };

    checkEmailConfirmation();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('email-banner-dismissed', Date.now().toString());
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        toast.error('Error al reenviar el email: ' + error.message);
      } else {
        toast.success('Email de confirmación reenviado. Revisa tu bandeja de entrada.');
      }
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      toast.error('Error al reenviar el email');
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Confirma tu email</span>
                {' '}para acceder a todas las funciones.
                {email && (
                  <span className="hidden sm:inline text-amber-600 ml-1">
                    Enviamos un correo a {email}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending}
              className="text-amber-700 border-amber-300 hover:bg-amber-100 text-xs sm:text-sm"
            >
              <Mail className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">
                {isResending ? 'Enviando...' : 'Reenviar email'}
              </span>
              <span className="sm:hidden">
                {isResending ? '...' : 'Reenviar'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
