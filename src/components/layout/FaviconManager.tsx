'use client';

import { useEffect } from 'react';

/**
 * Componente que detecta el tema del navegador (claro/oscuro)
 * y actualiza el favicon dinámicamente.
 *
 * - Tema claro: usa favicon-black.ico (logo negro sobre fondo claro)
 * - Tema oscuro: usa favicon-white.ico (logo blanco sobre fondo oscuro)
 */
export function FaviconManager() {
  useEffect(() => {
    const updateFavicon = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Buscar todos los links de favicon
      const links = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      );

      // Determinar qué favicon usar basado en el tema
      const faviconPath = isDark
        ? '/favicons/favicon-white.ico'
        : '/favicons/favicon-black.ico';

      links.forEach(link => {
        // Actualizar el href del favicon existente
        link.href = faviconPath;
      });

      // Si no existe ningún link de favicon, crear uno
      if (links.length === 0) {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.type = 'image/x-icon';
        newLink.href = faviconPath;
        document.head.appendChild(newLink);
      }
    };

    // Actualizar favicon al cargar
    updateFavicon();

    // Escuchar cambios en el tema del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateFavicon);

    // Limpiar el listener al desmontar
    return () => mediaQuery.removeEventListener('change', updateFavicon);
  }, []);

  // Este componente no renderiza nada
  return null;
}
