"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface StableImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  objectPosition?: string;
  priority?: boolean;
}

export function StableImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  fallbackSrc = "/logos/holistia-black.png",
  objectFit = 'cover',
  objectPosition = 'center center',
  priority = false
}: StableImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const imageProps = fill 
    ? { fill: true as const }
    : { width: width || 400, height: height || 300 };

  // Si no hay src, mostrar directamente el fallback
  if (!src || src === "") {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center`}>
        <Image
          src={fallbackSrc}
          alt="Holistia Logo"
          width={120}
          height={120}
          className="object-contain opacity-60"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        {...imageProps}
        className={`${className} transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          objectFit,
          objectPosition
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
      />
    </div>
  );
}
