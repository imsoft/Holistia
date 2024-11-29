"use server";

import prisma from "@/lib/db";

export const setLocationInfo = async (
  clerkId: string,
  locationData: Partial<{
    state: string | null;
    city: string | null;
    address: string | null;
    outerNumber: string | null;
    innerNumber: string | null;
    neighborhood: string | null;
    locationType: "HOUSE" | "OFFICE" | "BUILDING" | null;
    postalCode: string | null;
    googleMapsUrl: string | null;
  }> = {}
) => {
  try {
    // Filtrar campos válidos
    const validFields = [
      "state",
      "city",
      "address",
      "outerNumber",
      "innerNumber",
      "neighborhood",
      "postalCode",
      "googleMapsUrl",
      "locationType",
    ] as const;

    const sanitizedData = validFields.reduce((acc, field) => {
      if (field in locationData) {
        acc[field] = locationData[field as keyof typeof locationData] ?? null;
      }
      return acc;
    }, {} as Record<string, string | null | "HOUSE" | "OFFICE" | "BUILDING">);

    // Verificar si ya existe un registro de localización para el usuario
    let location = await prisma.location.findFirst({
      where: { clerkId },
    });

    if (!location) {
      // Si no existe, crear un nuevo registro
      location = await prisma.location.create({
        data: {
          clerkId,
          ...sanitizedData,
        },
      });
    } else {
      // Si existe, actualizar los datos
      location = await prisma.location.update({
        where: { id: location.id },
        data: sanitizedData,
      });
    }

    return location;
  } catch (error) {
    console.error("Error al establecer información de localización:", error);
    throw new Error("No se pudo establecer la información de localización.");
  }
};
