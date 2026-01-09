"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateTeamPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const challengeId = params.challengeId as string;

  const [teamName, setTeamName] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("/api/challenges/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          teamName: teamName.trim() || null,
          maxMembers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear equipo");
      }

      toast.success("Equipo creado exitosamente");
      router.push(`/patient/${patientId}/my-challenges/${challengeId}/team/invite?teamId=${data.data.id}`);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="h-8 w-8" />
          Crear Equipo
        </h1>
        <p className="text-muted-foreground">
          Forma un equipo de hasta 5 personas para completar el reto juntos
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Información del Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamName">
                  Nombre del equipo <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="teamName"
                  placeholder="Ej: Los Guerreros del Bienestar"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Máximo de miembros</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min={2}
                  max={5}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes tener entre 2 y 5 miembros en tu equipo
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/patient/${patientId}/my-challenges`)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear Equipo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
