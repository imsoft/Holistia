"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  wellness_areas: string[];
  email: string;
}

interface CenterProfessional {
  id: string;
  professional_id: string;
  professional: Professional;
  is_active: boolean;
}

interface HolisticCenterProfessionalsManagerProps {
  centerId: string;
  centerName: string;
}

export function HolisticCenterProfessionalsManager({
  centerId,
  centerName,
}: HolisticCenterProfessionalsManagerProps) {
  const [centerProfessionals, setCenterProfessionals] = useState<CenterProfessional[]>([]);
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [adding, setAdding] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchCenterProfessionals();
  }, [centerId]);

  const fetchCenterProfessionals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("holistic_center_professionals")
        .select(`
          id,
          professional_id,
          is_active,
          professional_applications (
            id,
            first_name,
            last_name,
            profession,
            wellness_areas,
            email
          )
        `)
        .eq("center_id", centerId)
        .eq("is_active", true);

      if (error) throw error;

      const formatted = data?.map((item: any) => ({
        id: item.id,
        professional_id: item.professional_id,
        is_active: item.is_active,
        professional: {
          id: item.professional_applications.id,
          first_name: item.professional_applications.first_name,
          last_name: item.professional_applications.last_name,
          profession: item.professional_applications.profession,
          wellness_areas: item.professional_applications.wellness_areas,
          email: item.professional_applications.email,
        },
      })) || [];

      setCenterProfessionals(formatted);
    } catch (error) {
      console.error("Error fetching center professionals:", error);
      toast.error("Error al cargar los profesionales");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProfessionals = async () => {
    try {
      // Get all approved professionals
      const { data, error } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession, wellness_areas, email")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("first_name");

      if (error) throw error;

      // Filter out professionals already in the center
      const assignedIds = centerProfessionals.map(cp => cp.professional_id);
      const available = data?.filter(p => !assignedIds.includes(p.id)) || [];

      setAvailableProfessionals(available);
    } catch (error) {
      console.error("Error fetching available professionals:", error);
      toast.error("Error al cargar los profesionales disponibles");
    }
  };

  const handleOpenDialog = () => {
    fetchAvailableProfessionals();
    setIsDialogOpen(true);
  };

  const handleAddProfessional = async (professionalId: string) => {
    try {
      setAdding(true);

      const { error } = await supabase
        .from("holistic_center_professionals")
        .insert({
          center_id: centerId,
          professional_id: professionalId,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Profesional agregado al centro");
      fetchCenterProfessionals();
      setIsDialogOpen(false);
      setSearchTerm("");
    } catch (error: any) {
      console.error("Error adding professional:", error);
      if (error.code === "23505") {
        toast.error("Este profesional ya está asignado al centro");
      } else {
        toast.error("Error al agregar el profesional");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveProfessional = async (relationId: string, professionalName: string) => {
    if (!confirm(`¿Eliminar a ${professionalName} del centro?`)) return;

    try {
      const { error } = await supabase
        .from("holistic_center_professionals")
        .delete()
        .eq("id", relationId);

      if (error) throw error;

      toast.success("Profesional eliminado del centro");
      fetchCenterProfessionals();
    } catch (error) {
      console.error("Error removing professional:", error);
      toast.error("Error al eliminar el profesional");
    }
  };

  const filteredAvailableProfessionals = availableProfessionals.filter(
    (prof) =>
      prof.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Profesionales del Centro</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Asigna profesionales registrados que trabajan en este centro
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Profesional
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : centerProfessionals.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No hay profesionales asignados aún
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {centerProfessionals.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {item.professional.first_name} {item.professional.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.professional.profession}
                  </p>
                  {item.professional.wellness_areas && item.professional.wellness_areas.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.professional.wellness_areas.slice(0, 3).map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                      {item.professional.wellness_areas.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.professional.wellness_areas.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleRemoveProfessional(
                      item.id,
                      `${item.professional.first_name} ${item.professional.last_name}`
                    )
                  }
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog to add professionals */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Agregar Profesional al Centro</DialogTitle>
            <DialogDescription>
              Selecciona un profesional aprobado para agregarlo a {centerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, profesión o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* List of available professionals */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredAvailableProfessionals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm
                    ? "No se encontraron profesionales"
                    : "No hay profesionales disponibles para agregar"}
                </p>
              ) : (
                filteredAvailableProfessionals.map((prof) => (
                  <Card key={prof.id} className="hover:bg-muted/50 cursor-pointer">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">
                          {prof.first_name} {prof.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{prof.profession}</p>
                        <p className="text-xs text-muted-foreground mt-1">{prof.email}</p>
                        {prof.wellness_areas && prof.wellness_areas.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {prof.wellness_areas.slice(0, 3).map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {prof.wellness_areas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{prof.wellness_areas.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddProfessional(prof.id)}
                        disabled={adding}
                      >
                        {adding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Agregar"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
