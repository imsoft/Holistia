import { getprofessionalSessionDetailInfo } from "@/actions";
import {
  ClosingHoursInput,
  ConsultationFormatInput,
  ConsultoryImageInput,
  OpeningHoursInput,
  PriceInput,
  SessionDurationInput,
} from "@/components/user/medical-session";
import { currentUser } from "@clerk/nextjs/server";

const MedicalSessionPage = async () => {
  const user = await currentUser();

  if (!user) {
    return <div>Por favor, inicia sesión para acceder a esta página.</div>;
  }

  const professionalSessionDetailData = await getprofessionalSessionDetailInfo(
    user?.id ?? ""
  );

  return (
    <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">
          Sesión médica
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Aquí puedes actualizar tu información de la sesión médica.
        </p>

        <PriceInput
          initialData={professionalSessionDetailData}
          id={user?.id ?? ""}
        />
        <SessionDurationInput
          initialData={professionalSessionDetailData}
          id={user?.id ?? ""}
        />
        <OpeningHoursInput
          initialData={professionalSessionDetailData}
          id={user?.id ?? ""}
        />
        <ClosingHoursInput
          initialData={professionalSessionDetailData}
          id={user?.id ?? ""}
        />
        <ConsultationFormatInput
          initialData={professionalSessionDetailData}
          id={user?.id ?? ""}
        />
        <ConsultoryImageInput
          initialData={professionalSessionDetailData}
          id={user?.id ?? ""}
        />
      </div>
    </div>
  );
};

export default MedicalSessionPage;
