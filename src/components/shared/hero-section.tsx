"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Navbar } from "./navbar";

// Imágenes del carrusel
const showcaseImages = Array.from({ length: 19 }, (_, i) => ({
  src: `/hero/${i + 1}.jpg`,
  alt: `Showcase image ${i + 1}`,
})).filter((_, i) => {
  // Solo incluir imágenes que existen (1, 4, 6, 7, 11, 13, 14, 18, 19, 23, 24, 25, 27, 28, 29, 30, 31, 35, 36, 37)
  const existingImages = [1, 4, 6, 7, 11, 13, 14, 18, 19, 23, 24, 25, 27, 28, 29, 30, 31, 35, 36, 37];
  return existingImages.includes(i + 1);
});

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore/professionals?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Tu ecosistema del bienestar
          </div>

          {/* Título principal */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Donde tu transformación{" "}
            <span className="text-primary">sucede</span>
          </h1>

          {/* Subtítulo */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Explora expertos, programas, experiencias, restaurantes y espacios
            diseñados para acompañarte en tu bienestar físico, mental,
            emocional, espiritual y social. Aquí tu cambio sí toma forma.
          </p>

          {/* Buscador */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row sm:gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Busca expertos, servicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 pr-4 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 gap-2">
              Encuentra a tu experto
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Carrusel de imágenes (versión simplificada) */}
        <div className="mt-16 w-full overflow-hidden">
          <div className="relative">
            {/* Primera fila - movimiento hacia la izquierda */}
            <div className="flex animate-scroll-left gap-4 py-2">
              {[...showcaseImages, ...showcaseImages].map((image, index) => (
                <div
                  key={`row1-${index}`}
                  className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg sm:h-40 sm:w-56 lg:h-48 lg:w-64"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="(max-width: 640px) 192px, (max-width: 1024px) 224px, 256px"
                  />
                </div>
              ))}
            </div>

            {/* Segunda fila - movimiento hacia la derecha */}
            <div className="flex animate-scroll-right gap-4 py-2">
              {[...showcaseImages.reverse(), ...showcaseImages].map(
                (image, index) => (
                  <div
                    key={`row2-${index}`}
                    className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg sm:h-40 sm:w-56 lg:h-48 lg:w-64"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                      sizes="(max-width: 640px) 192px, (max-width: 1024px) 224px, 256px"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para las animaciones del carrusel */}
      <style jsx global>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }

        .animate-scroll-right {
          animation: scroll-right 60s linear infinite;
        }

        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
