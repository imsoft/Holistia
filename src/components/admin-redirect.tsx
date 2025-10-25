"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/use-profile';

export function AdminRedirect() {
  const params = useParams();
  const router = useRouter();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (!loading && profile) {
      // 🔒 SEGURIDAD: Verificar que el usuario sea admin
      if (profile.type !== 'admin') {
        console.warn('⚠️ Unauthorized access attempt to admin area by:', profile.email);
        router.replace('/'); // Redirigir a home
        return;
      }

      // Verificar que el ID en la URL coincida con el usuario
      if (params.id !== profile.id) {
        const currentPath = window.location.pathname;
        const newPath = currentPath.replace(`/admin/${params.id}`, `/admin/${profile.id}`);
        router.replace(newPath);
      }
    }
    
    // Si no hay perfil y no está cargando, redirigir a login
    if (!loading && !profile) {
      router.replace('/login');
    }
  }, [profile, loading, params.id, router]);

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
