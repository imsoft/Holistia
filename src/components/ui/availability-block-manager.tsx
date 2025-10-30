'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BlocksCalendarView } from '@/components/ui/blocks-calendar-view';
import { BlockCreatorTabs } from '@/components/ui/block-creator-tabs';
import { createClient } from '@/utils/supabase/client';
import type { AvailabilityBlock } from '@/types/availability';

interface AvailabilityBlockManagerProps {
  professionalId: string;
  userId?: string;
}

export default function AvailabilityBlockManager({ professionalId, userId: propUserId }: AvailabilityBlockManagerProps) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);

  // Obtener userId si no se pasó como prop
  useEffect(() => {
    if (!propUserId) {
      const getUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      };
      getUserId();
    }
  }, [propUserId, supabase]);

  const handleCreateBlock = () => {
    setEditingBlock(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditBlock = (block: AvailabilityBlock) => {
    setEditingBlock(block);
    setIsEditDialogOpen(true);
  };

  const handleBlockCreated = () => {
    setIsCreateDialogOpen(false);
    // El componente BlocksCalendarView se actualizará automáticamente
  };

  const handleBlockUpdated = () => {
    setIsEditDialogOpen(false);
    setEditingBlock(null);
    // El componente BlocksCalendarView se actualizará automáticamente
  };

  const handleDeleteBlock = () => {
    // El componente BlocksCalendarView maneja la eliminación
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BlocksCalendarView
        professionalId={professionalId}
        onEditBlock={handleEditBlock}
        onDeleteBlock={handleDeleteBlock}
        onCreateBlock={handleCreateBlock}
      />

      {/* Dialog para crear bloqueo */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Bloqueo</DialogTitle>
          </DialogHeader>
          <BlockCreatorTabs
            professionalId={professionalId}
            userId={userId}
            onBlockCreated={handleBlockCreated}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar bloqueo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Bloqueo</DialogTitle>
          </DialogHeader>
          <BlockCreatorTabs
            professionalId={professionalId}
            userId={userId}
            editingBlock={editingBlock}
            onBlockUpdated={handleBlockUpdated}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingBlock(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
