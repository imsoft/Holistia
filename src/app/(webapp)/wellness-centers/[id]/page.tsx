import { notFound } from "next/navigation";
import Link from "next/link";
import { wellnessCenterService } from "@/services/wellness-center-service";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WellnessCenterProfile } from "@/components/wellness-center/wellness-center-profile";

export default async function WellnessCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const wellnessCenter = await wellnessCenterService.getWellnessCenterById(id);

  // Si no se encuentra el centro wellness, mostrar la página 404
  if (!wellnessCenter) {
    notFound();
  }

  // Obtener información de contacto
  const contact = await wellnessCenterService.getWellnessCenterContact(id);

  // Obtener imágenes de la galería
  const images = await wellnessCenterService.getWellnessCenterImages(id);

  // Obtener horarios de apertura
  const openingHours = await wellnessCenterService.getOpeningHours(id);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/wellness-centers">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a centros wellness
          </Button>
        </Link>
      </div>

      <WellnessCenterProfile
        wellnessCenter={wellnessCenter}
        contact={contact}
        images={images}
        openingHours={openingHours}
      />
    </div>
  );
}
