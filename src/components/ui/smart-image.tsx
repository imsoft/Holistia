"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  showControls?: boolean;
  defaultFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  defaultPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

type ObjectFit = 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
type ObjectPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function SmartImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  fallbackSrc = "/logos/holistia-black.png",
  showControls = false,
  defaultFit = 'contain',
  defaultPosition = 'center'
}: SmartImageProps) {
  const [objectFit, setObjectFit] = useState<ObjectFit>(defaultFit);
  const [objectPosition, setObjectPosition] = useState<ObjectPosition>(defaultPosition);
  const [showFallback, setShowFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
    setShowFallback(true);
  };

  const handleImageLoad = () => {
    setHasError(false);
    setShowFallback(false);
  };

  const fitOptions: { value: ObjectFit; label: string; description: string }[] = [
    { value: 'contain', label: 'Contener', description: 'Muestra la imagen completa sin recortar' },
    { value: 'cover', label: 'Cubrir', description: 'Llena el espacio, puede recortar la imagen' },
    { value: 'fill', label: 'Llenar', description: 'Estira la imagen para llenar el espacio' },
    { value: 'scale-down', label: 'Reducir', description: 'Reduce si es necesario, no aumenta' },
    { value: 'none', label: 'Original', description: 'Tamaño original de la imagen' }
  ];

  const positionOptions: { value: ObjectPosition; label: string }[] = [
    { value: 'center', label: 'Centro' },
    { value: 'top', label: 'Superior' },
    { value: 'bottom', label: 'Inferior' },
    { value: 'left', label: 'Izquierda' },
    { value: 'right', label: 'Derecha' },
    { value: 'top-left', label: 'Superior Izquierda' },
    { value: 'top-right', label: 'Superior Derecha' },
    { value: 'bottom-left', label: 'Inferior Izquierda' },
    { value: 'bottom-right', label: 'Inferior Derecha' }
  ];

  const getPositionStyle = (position: ObjectPosition): string => {
    const positions: Record<ObjectPosition, string> = {
      'center': 'center center',
      'top': 'center top',
      'bottom': 'center bottom',
      'left': 'left center',
      'right': 'right center',
      'top-left': 'left top',
      'top-right': 'right top',
      'bottom-left': 'left bottom',
      'bottom-right': 'right bottom'
    };
    return positions[position];
  };

  const imageProps = fill 
    ? { fill: true as const }
    : { width: width || 400, height: height || 300 };

  return (
    <div className="relative group">
      {/* Imagen principal */}
      <Image
        src={showFallback || hasError ? fallbackSrc : src}
        alt={alt}
        {...imageProps}
        className={`${className} ${objectFit === 'contain' ? 'bg-gradient-to-br from-gray-50 to-gray-100 p-2' : ''}`}
        style={{
          objectFit,
          objectPosition: getPositionStyle(objectPosition)
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />

      {/* Controles (solo si showControls es true) */}
      {showControls && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Opciones de ajuste */}
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Ajuste de imagen
              </div>
              {fitOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setObjectFit(option.value)}
                  className="flex flex-col items-start gap-1"
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </DropdownMenuItem>
              ))}
              
              {/* Separador */}
              <div className="my-1 border-t border-border" />
              
              {/* Opciones de posición */}
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Posición
              </div>
              <div className="grid grid-cols-3 gap-1 p-1">
                {positionOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setObjectPosition(option.value)}
                    className="text-xs justify-center p-2"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Indicador de ajuste actual */}
      {showControls && (
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
            {fitOptions.find(opt => opt.value === objectFit)?.label}
          </div>
        </div>
      )}
    </div>
  );
}
