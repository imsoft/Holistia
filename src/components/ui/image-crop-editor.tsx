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

interface ImageCropEditorProps {
  imageSrc: string;
  currentPosition?: string;
  onSave: (position: string) => void;
  onCancel: () => void;
  professionalName: string;
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

export function ImageCropEditor({ 
  imageSrc, 
  currentPosition = 'center center', 
  onSave, 
  onCancel,
  professionalName 
}: ImageCropEditorProps) {
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
    <div className="space-y-10 p-6">
      {/* Header */}
      <CardHeader className="pb-8">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Crop className="h-7 w-7" />
          Editor de Imagen de Perfil
        </CardTitle>
        <p className="text-lg text-muted-foreground">
          Ajusta cómo se verá tu foto en las cards de profesionales
        </p>
      </CardHeader>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Vista previa de la card - Mitad del ancho */}
        <div>
          <Card>
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xl">Vista previa de la card</h3>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  <Eye className="h-5 w-5 mr-2" />
                  {isPreviewMode ? 'Editar' : 'Vista previa'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                ref={cardRef}
                className="relative w-full h-80 bg-white border rounded-lg overflow-hidden shadow-sm"
              >
                <Image
                  src={imageSrc}
                  alt={`Vista previa para ${professionalName}`}
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

        {/* Controles - Mitad del ancho */}
        <div className="space-y-6">
          {/* Opciones de posición */}
          <Card>
            <CardHeader className="pb-4">
              <h3 className="font-semibold text-lg">Seleccionar posición</h3>
              <p className="text-base text-muted-foreground">
                Elige qué parte se mostrará
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {positionOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedPosition === option.value ? "default" : "outline"}
                    size="default"
                    onClick={() => setSelectedPosition(option.value)}
                    className="flex flex-col items-center gap-2 h-20 p-4"
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Controles de transformación */}
          <Card>
            <CardHeader className="pb-4">
              <h3 className="font-semibold text-lg">Controles de Imagen</h3>
              <p className="text-base text-muted-foreground">
                Ajusta zoom y rotación
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-base font-medium min-w-[4rem]">Zoom:</span>
                  <Button variant="outline" size="default" onClick={handleZoomOut}>
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <span className="text-base min-w-[4rem] text-center font-medium">{Math.round(scale * 100)}%</span>
                  <Button variant="outline" size="default" onClick={handleZoomIn}>
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-base font-medium min-w-[4rem]">Rotación:</span>
                  <Button variant="outline" size="default" onClick={handleRotateLeft}>
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                  <span className="text-base min-w-[4rem] text-center font-medium">{rotation}°</span>
                  <Button variant="outline" size="default" onClick={handleRotateRight}>
                    <RotateCw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consejos */}
          <Card>
            <CardHeader className="pb-4">
              <h3 className="font-semibold text-lg">💡 Consejos</h3>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Centro</strong>: Fotos centradas</li>
                <li>• <strong>Superior</strong>: Mostrar rostro</li>
                <li>• <strong>Inferior</strong>: Mostrar torso</li>
                <li>• <strong>Esquinas</strong>: Composición artística</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-6 pt-6">
        <Button variant="outline" size="lg" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="lg" onClick={handleSave}>
          <Save className="h-5 w-5 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
