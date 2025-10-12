"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  Crop,
  Eye,
  Save
} from "lucide-react";

interface EventImageCropEditorProps {
  imageSrc: string;
  currentPosition?: string;
  onSave: (position: string) => void;
  onCancel: () => void;
  eventName: string;
}

type Position = 
  | 'center center'
  | 'top center'
  | 'bottom center'
  | 'left center'
  | 'right center'
  | 'top left'
  | 'top right'
  | 'bottom left'
  | 'bottom right';

export function EventImageCropEditor({ 
  imageSrc, 
  currentPosition = 'center center', 
  onSave, 
  onCancel,
  eventName 
}: EventImageCropEditorProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position>(currentPosition as Position);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const positionOptions: { value: Position; label: string; icon: string }[] = [
    { value: 'center center', label: 'Centro', icon: '🎯' },
    { value: 'top center', label: 'Superior', icon: '⬆️' },
    { value: 'bottom center', label: 'Inferior', icon: '⬇️' },
    { value: 'left center', label: 'Izquierda', icon: '⬅️' },
    { value: 'right center', label: 'Derecha', icon: '➡️' },
    { value: 'top left', label: 'Superior Izq.', icon: '↖️' },
    { value: 'top right', label: 'Superior Der.', icon: '↗️' },
    { value: 'bottom left', label: 'Inferior Izq.', icon: '↙️' },
    { value: 'bottom right', label: 'Inferior Der.', icon: '↘️' }
  ];

  const handleSave = () => {
    onSave(selectedPosition);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Crop className="h-6 w-6" />
          Editor de Imagen del Evento
        </CardTitle>
        <p className="text-base text-muted-foreground">
          Ajusta cómo se verá la imagen de tu evento en las cards
        </p>
      </CardHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vista previa de la card - 2/3 del ancho */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Vista previa de la card</h3>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  <Eye className="h-5 w-5 mr-2" />
                  {isPreviewMode ? 'Editar' : 'Vista previa'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                ref={cardRef}
                className="relative w-full h-72 bg-white border rounded-lg overflow-hidden shadow-sm"
              >
                <Image
                  src={imageSrc}
                  alt={`Vista previa para ${eventName}`}
                  fill
                  className="object-cover transition-all duration-200"
                  style={{
                    objectPosition: selectedPosition,
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                />
                
                {/* Overlay de posición */}
                {!isPreviewMode && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      Posición: {positionOptions.find(p => p.value === selectedPosition)?.label}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles - 1/3 del ancho */}
        <div className="space-y-6">
          {/* Opciones de posición */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-base">Seleccionar posición</h3>
              <p className="text-sm text-muted-foreground">
                Elige qué parte se mostrará
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {positionOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedPosition === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPosition(option.value)}
                    className="flex flex-col items-center gap-1 h-16 p-2"
                  >
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Controles de transformación */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-base">Controles de Imagen</h3>
              <p className="text-sm text-muted-foreground">
                Ajusta zoom y rotación
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[3rem]">Zoom:</span>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center font-medium">{Math.round(scale * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[3rem]">Rotación:</span>
                  <Button variant="outline" size="sm" onClick={handleRotateLeft}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center font-medium">{rotation}°</span>
                  <Button variant="outline" size="sm" onClick={handleRotateRight}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consejos compactos */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-base">💡 Consejos</h3>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Centro</strong>: Imágenes equilibradas</li>
                <li>• <strong>Superior</strong>: Mostrar logos/títulos</li>
                <li>• <strong>Inferior</strong>: Mostrar espacios</li>
                <li>• <strong>Esquinas</strong>: Composición artística</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" size="default" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="default" onClick={handleSave}>
          <Save className="h-5 w-5 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
