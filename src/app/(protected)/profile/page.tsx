import {
  FacebookInput,
  InstagramInput,
  LinkedInInput,
  PhoneNumberInput,
  ThreadsInput,
  TiktokInput,
  XInput,
} from "@/components/user/contact";
import { getContactInfo } from "@/actions";
import { currentUser } from "@clerk/nextjs/server";

const ProfilePage = async () => {
  const user = await currentUser();

  if (!user) {
    return <div>Por favor, inicia sesión para acceder a esta página.</div>;
  }

  const contactData = await getContactInfo(user?.id ?? "");

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Contacto
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Aquí puedes actualizar tu información de contacto.
          </p>

          <FacebookInput initialData={contactData!} id={user?.id ?? ""} />
          <InstagramInput initialData={contactData!} id={user?.id ?? ""} />
          <TiktokInput initialData={contactData!} id={user?.id ?? ""} />
          <ThreadsInput initialData={contactData!} id={user?.id ?? ""} />
          <XInput initialData={contactData!} id={user?.id ?? ""} />
          <LinkedInInput initialData={contactData!} id={user?.id ?? ""} />
          <PhoneNumberInput initialData={contactData!} id={user?.id ?? ""} />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
