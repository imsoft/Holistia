"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalProductCard } from "@/components/ui/digital-product-card";
import type { DigitalProductCardProduct } from "@/components/ui/digital-product-card";

export interface DigitalProductListProps {
  products: DigitalProductCardProduct[];
  layout: "carousel" | "grid";
  showProfessional?: boolean;
  /** Mostrar botón de favoritos solo si el usuario tiene sesión iniciada. */
  showFavoriteButton?: boolean;
  /** Clase extra para el contenedor (ej. para padding del carrusel) */
  className?: string;
}

function scrollContainer(
  ref: React.RefObject<HTMLDivElement | null>,
  direction: "left" | "right",
  step = 320
) {
  const el = ref.current;
  if (!el) return;
  const scroll = direction === "left" ? -step : step;
  el.scrollBy({ left: scroll, behavior: "smooth" });
}

export function DigitalProductList({
  products,
  layout,
  showProfessional = true,
  showFavoriteButton = false,
  className = "",
}: DigitalProductListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  if (layout === "grid") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
        {products.map((product) => (
          <DigitalProductCard
            key={product.id}
            product={product}
            showProfessional={showProfessional}
            showFavoriteButton={showFavoriteButton}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => scrollContainer(scrollRef, "left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => scrollContainer(scrollRef, "right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 px-12"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {products.map((product) => (
          <div key={product.id} className="shrink-0 w-[280px] sm:w-[320px]">
            <DigitalProductCard
              product={product}
              showProfessional={showProfessional}
              showFavoriteButton={showFavoriteButton}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
