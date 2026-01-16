"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { ServiceManager } from "@/components/ui/service-manager";

interface ServicesTabProps {
  professionalId: string;
}

export function ServicesTab({ professionalId }: ServicesTabProps) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserId();
  }, [professionalId]);

  const fetchUserId = async () => {
    try {
      // Obtener el user_id del profesional
      const { data: professionalData, error } = await supabase
        .from('professional_applications')
        .select('user_id')
        .eq('id', professionalId)
        .single();

      if (error) throw error;
      setUserId(professionalData?.user_id || null);
    } catch (error) {
      console.error('Error fetching user_id:', error);
      toast.error('Error al cargar información del profesional');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userId) {
    return (
      <Card className="py-4">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No se pudo obtener la información del profesional
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
          <CardDescription>
            Gestiona los servicios que ofrece este profesional. Puedes crear, editar y eliminar servicios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceManager 
            professionalId={professionalId} 
            userId={userId} 
            isAdminContext={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
