import {
  AddressInput,
  CityInput,
  GoogleMapsUrlInput,
  InnerNumberInput,
  LocationTypeInput,
  NeighborhoodInput,
  OuterNumberInput,
  PostalCodeInput,
  StateInput,
} from "@/components/user/location";
import { getLocationInfo } from "@/actions";
import { currentUser } from "@clerk/nextjs/server";

const LocationPage = async () => {
  const user = await currentUser();

  if (!user) {
    return <div>Por favor, inicia sesión para acceder a esta página.</div>;
  }

  const contactData = await getLocationInfo(user?.id ?? "");

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
          <AddressInput initialData={contactData!} id={user?.id ?? ""} />
          <CityInput initialData={contactData!} id={user?.id ?? ""} />
          <GoogleMapsUrlInput initialData={contactData!} id={user?.id ?? ""} />
          <InnerNumberInput initialData={contactData!} id={user?.id ?? ""} />
          <LocationTypeInput initialData={contactData!} id={user?.id ?? ""} />
          <NeighborhoodInput initialData={contactData!} id={user?.id ?? ""} />
          <OuterNumberInput initialData={contactData!} id={user?.id ?? ""} />
          <PostalCodeInput initialData={contactData!} id={user?.id ?? ""} />
          <StateInput initialData={contactData!} id={user?.id ?? ""} />
        </div>
      </div>
    </>
  );
};

export default LocationPage;
