import {
  AspectInput,
  FocusAreasInput,
  LanguagesInput,
  SpecialtyInput,
  TherapyTypeInput,
} from "@/components/user/professional";
import { getProfessionalInfo } from "@/actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

const ProfessionalPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Verificar si el usuario está aprobado como profesional
  const professional = await prisma.professional.findUnique({
    where: { clerkId: user.id },
  });

  if (!professional || !professional.approved) {
    redirect("/profile/request-professional");
  }

  const professionalData = await getProfessionalInfo(user.id);

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Profesional
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Aquí puedes actualizar tu información profesional.
          </p>

          <SpecialtyInput initialData={professionalData!} id={user?.id ?? ""} />
          <FocusAreasInput
            initialData={professionalData!}
            id={user?.id ?? ""}
          />
          <AspectInput initialData={professionalData!} id={user?.id ?? ""} />
          <TherapyTypeInput
            initialData={professionalData!}
            id={user?.id ?? ""}
          />
          <LanguagesInput initialData={professionalData!} id={user?.id ?? ""} />
        </div>
      </div>
    </>
  );
};

export default ProfessionalPage;
