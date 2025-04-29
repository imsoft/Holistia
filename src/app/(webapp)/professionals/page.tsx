import Link from "next/link";
import { professionalService } from "@/services/professional-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Plus } from "lucide-react";

export default async function ProfessionalsPage() {
  const professionals = await professionalService.getProfessionals(20, 0);

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Gradient blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profesionales</h1>
            <p className="text-white/70">
              Explora y gestiona los profesionales de bienestar
            </p>
          </div>
          <Link href="/professionals/new">
            <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
              <span className="relative z-10 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Profesional
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {professionals.map((professional) => (
            <Link
              key={professional.id}
              href={`/professionals/${professional.id}`}
            >
              <Card className="bg-[#1A1A1A] text-white hover:bg-[#252525] transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      {professional.image_url ? (
                        <AvatarImage
                          src={professional.image_url || "/placeholder.svg"}
                          alt={professional.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] text-white">
                          {professional.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {professional.name}
                      </h3>
                      <p className="text-sm text-white/70">
                        {professional.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center space-x-2 text-sm text-white/70">
                      <Star
                        className={`h-4 w-4 ${
                          professional.rating ? "text-yellow-400" : ""
                        }`}
                      />
                      <span>
                        {professional.rating?.toFixed(1) || "Sin valoraciones"}
                      </span>
                    </div>
                    {professional.location && (
                      <div className="flex items-center space-x-2 text-sm text-white/70">
                        <MapPin className="h-4 w-4" />
                        <span>{professional.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
