"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useTransition } from "react";
import { requestProfessional } from "@/actions/requestProfessional";

const RequestProfessionalPage = () => {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const handleRequest = () => {
    if (!user?.id) {
      alert("User ID is not available.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await requestProfessional(user.id);
        alert(result.message);
      } catch (error) {
        console.error(error);
        alert("Error al enviar la solicitud.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-xl text-center">
      <h2 className="text-lg font-semibold">Convertirte en Profesional</h2>
      <p className="mt-2 text-sm text-gray-600">
        Ahora puedes convertirte en profesional y tener acceso a más opciones.
      </p>
      <Button
        onClick={handleRequest}
        disabled={isPending}
        className={`mt-4 rounded bg-holistia-600 px-4 py-2 text-white hover:bg-holistia-500 ${
          isPending ? "opacity-50" : ""
        }`}
      >
        {isPending ? "Procesando..." : "Solicitar acceso"}
      </Button>
    </div>
  );
};

export default RequestProfessionalPage;
