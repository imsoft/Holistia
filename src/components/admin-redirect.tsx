"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/use-profile';

export function AdminRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (loading) return; // Esperar a que termine de cargar

    if (!profile) {
      // Si no hay perfil, redirigir a login
      router.replace('/login');
      return;
    }

    // 🔒 SEGURIDAD: Verificar que el usuario sea admin
    if (profile.type !== 'admin') {
      console.warn('⚠️ Unauthorized access attempt to admin area by:', profile.email);
      router.replace('/'); // Redirigir a home
      return;
    }

    // Si la ruta tiene un ID en la URL (formato antiguo), redirigir a la ruta limpia
    const idMatch = pathname.match(/^\/admin\/([^/]+)(.*)$/);
    if (idMatch && idMatch[1] !== 'dashboard' && idMatch[1] !== 'professionals' && 
        idMatch[1] !== 'events' && idMatch[1] !== 'challenges' && 
        idMatch[1] !== 'blog' && idMatch[1] !== 'users' && 
        idMatch[1] !== 'applications' && idMatch[1] !== 'analytics' &&
        idMatch[1] !== 'finances' && idMatch[1] !== 'tickets' &&
        idMatch[1] !== 'companies' && idMatch[1] !== 'shops' &&
        idMatch[1] !== 'restaurants' && idMatch[1] !== 'holistic-centers' &&
        idMatch[1] !== 'digital-products' &&
        idMatch[1] !== 'certifications' && idMatch[1] !== 'services-costs' &&
        idMatch[1] !== 'holistic-services' && idMatch[1] !== 'my-events' &&
        idMatch[1] !== 'sync-tools' &&
        idMatch[1] !== 'github-commits' && idMatch[1] !== 'ai-agent' &&
        idMatch[1] !== 'whatsapp-test') {
      // Es un ID de usuario, redirigir a la ruta limpia
      const newPath = `/admin${idMatch[2] || '/dashboard'}`;
      router.replace(newPath);
      return;
    }
  }, [profile, loading, pathname, router]);

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
