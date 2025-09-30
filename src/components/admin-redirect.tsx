"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AdminRedirect() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && params.id !== user.id) {
      // Redirigir a la URL correcta con el ID del usuario autenticado
      const currentPath = window.location.pathname;
      const newPath = currentPath.replace(`/admin/${params.id}`, `/admin/${user.id}`);
      router.replace(newPath);
    }
  }, [user, loading, params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return null;
}
