"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";

interface ServicesTabProps {
  professionalId: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
  modality: string;
}

export function ServicesTab({ professionalId }: ServicesTabProps) {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [professionalId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_services')
        .select('*')
        .eq('user_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
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

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>Gestiona los servicios que ofrece este profesional</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay servicios registrados
            </p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.is_active && (
                        <Badge variant="default">Activo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>{service.duration_minutes} min</span>
                      <span>${service.price} {service.currency}</span>
                      <span>{service.modality}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
