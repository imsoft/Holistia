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
    <div className="space-y-6">
      {/* Header */}
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Crop className="h-5 w-5" />
          Editor de Imagen de Perfil
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ajusta cómo se verá tu foto en las cards de profesionales
        </p>
      </CardHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vista previa de la card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Vista previa de la card</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Editar' : 'Vista previa'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={cardRef}
              className="relative w-full h-48 bg-white border rounded-lg overflow-hidden shadow-sm"
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
            
            {/* Controles de transformación */}
            {!isPreviewMode && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Zoom:</span>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Rotación:</span>
                  <Button variant="outline" size="sm" onClick={handleRotateLeft}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center">{rotation}°</span>
                  <Button variant="outline" size="sm" onClick={handleRotateRight}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opciones de posición */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Seleccionar posición</h3>
            <p className="text-sm text-muted-foreground">
              Elige qué parte de tu imagen quieres que se muestre en la card
            </p>
          </CardHeader>
          <CardContent>
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
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">💡 Consejos:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Centro</strong>: Mejor para fotos cuadradas</li>
                <li>• <strong>Superior</strong>: Para mostrar el rostro completo</li>
                <li>• <strong>Inferior</strong>: Para mostrar el torso</li>
                <li>• <strong>Esquinas</strong>: Para composiciones específicas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
