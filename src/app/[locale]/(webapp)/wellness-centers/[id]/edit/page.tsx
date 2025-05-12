import { notFound } from "next/navigation";
import { wellnessCenterService } from "@/services/wellness-center-service";
import { WellnessCenterForm } from "@/components/wellness-center/wellness-center-form";

export default async function EditWellnessCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const wellnessCenter = await wellnessCenterService.getWellnessCenterById(id);

  if (!wellnessCenter) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] text-transparent bg-clip-text">
        Editar Centro Wellness
      </h1>
      <p className="text-white/70 mb-8">
        Actualiza la información de tu centro wellness
      </p>

      <WellnessCenterForm wellnessCenter={wellnessCenter} isEdit />
    </div>
  );
}
