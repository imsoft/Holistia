'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { BlocksCalendarView } from '@/components/ui/blocks-calendar-view';
import { createClient } from '@/utils/supabase/client';
import type { AvailabilityBlock } from '@/types/availability';

interface AvailabilityBlockManagerProps {
  professionalId: string;
  userId?: string;
}

export default function AvailabilityBlockManager({ professionalId, userId: propUserId }: AvailabilityBlockManagerProps) {
  const router = useRouter();
  const params = useParams();
  const professionalUserId = params.id as string;

  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(propUserId || null);

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
    router.push(`/professional/${professionalUserId}/availability/blocks/new`);
  };

  const handleEditBlock = (block: AvailabilityBlock) => {
    router.push(`/professional/${professionalUserId}/availability/blocks/${block.id}/edit`);
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
        userId={userId}
        onEditBlock={handleEditBlock}
        onDeleteBlock={handleDeleteBlock}
        onCreateBlock={handleCreateBlock}
      />
    </div>
  );
}
