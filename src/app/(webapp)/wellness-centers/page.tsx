import Link from "next/link";
import { wellnessCenterService } from "@/services/wellness-center-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Plus } from "lucide-react";
import Image from "next/image";

export default async function WellnessCentersPage() {
  // Obtener todos los centros wellness
  const wellnessCenters = await wellnessCenterService.getWellnessCenters();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Centros Wellness</h1>
          <p className="text-white/70">
            Explora centros de bienestar y salud integral
          </p>
        </div>
        <Link href="/wellness-centers/new">
          <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Centro
            <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
          </Button>
        </Link>
      </div>

      {wellnessCenters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wellnessCenters.map((center) => (
            <Link key={center.id} href={`/wellness-centers/${center.id}`}>
              <Card className="bg-white/5 border-white/10 text-white h-full hover:bg-white/10 transition-colors cursor-pointer">
                <div className="h-48 relative overflow-hidden rounded-t-lg">
                  <Image
                    src={center.cover_image_url || "/serene-wellness-space.png"}
                    alt={center.name}
                    className="w-full h-full object-cover"
                    width={500}
                    height={300}
                  />
                  {center.verified && (
                    <Badge className="absolute top-4 right-4 bg-green-500/80 hover:bg-green-500">
                      Verificado
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div>
                      <span className="text-xl">{center.name}</span>
                      <p className="text-sm text-white/70 mt-1">
                        {center.type}
                      </p>
                    </div>
                    {center.rating && (
                      <div className="flex items-center bg-white/10 px-2 py-1 rounded">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1" />
                        <span>{center.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 line-clamp-2">
                    {center.short_description}
                  </p>
                </CardContent>
                <CardFooter>
                  {center.location && (
                    <div className="flex items-center text-white/60">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{center.location}</span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/5 rounded-lg">
          <h3 className="text-xl font-medium mb-2">
            No hay centros wellness disponibles
          </h3>
          <p className="text-white/70 mb-6">
            Sé el primero en añadir un centro wellness a la plataforma
          </p>
          <Link href="/wellness-centers/new">
            <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Centro Wellness
              <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
