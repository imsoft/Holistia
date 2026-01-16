"use client";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/actions/auth/actions";
import { useState } from "react";

interface GoogleButtonProps {
  text?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function GoogleButton({ 
  text = "Continuar con Google", 
  variant = "outline",
  size = "default",
  className = ""
}: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    // Timeout de seguridad: si después de 5 segundos no hay respuesta, mostrar error
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      console.error("Timeout al iniciar sesión con Google");
    }, 5000);
    
    try {
      const result = await signInWithGoogle();
      
      // Limpiar timeout si la acción se completó
      clearTimeout(timeoutId);
      
      if (result?.error) {
        console.error("Error al iniciar sesión con Google:", result.error);
        setIsLoading(false);
        return;
      }
      
      if (result?.url) {
        // Redirigir usando window.location para asegurar que funcione
        window.location.href = result.url;
        // No resetear isLoading aquí porque la página se está redirigiendo
        return;
      }
      
      // Si no hay URL, mostrar error
      console.error("No se recibió URL de autenticación");
      setIsLoading(false);
    } catch (error: unknown) {
      // Limpiar timeout si hubo error
      clearTimeout(timeoutId);
      
      // Verificar si es un error de redirect de Next.js (que no es realmente un error)
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // Es un redirect, no un error real - dejar que Next.js lo maneje
        return;
      }
      
      console.error("Error inesperado al iniciar sesión con Google:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full flex items-center justify-center gap-3 ${className}`}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path
            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
            fill="#EA4335"
          />
          <path
            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
            fill="#4285F4"
          />
          <path
            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
            fill="#FBBC05"
          />
          <path
            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
            fill="#34A853"
          />
        </svg>
      )}
      <span className="text-sm font-semibold">{text}</span>
    </Button>
  );
}
