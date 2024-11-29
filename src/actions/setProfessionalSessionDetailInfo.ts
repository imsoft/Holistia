"use server";

import prisma from "@/lib/db";

export const setProfessionalSessionDetailInfo = async (
  clerkId: string,
  sessionData: Partial<{
    price: number | null;
    sessionDuration: string | null;
    openingHours: string | null;
    closingHours: string | null;
    consultationFormat: "IN_PERSON" | "ONLINE" | "BOTH" | null;
    consultoryImages: string[] | null;
  }> = {}
) => {
  try {
    // Filtrar campos válidos
    const validFields = [
      "price",
      "sessionDuration",
      "openingHours",
      "closingHours",
      "consultationFormat",
      "consultoryImages",
    ] as const;

    const sanitizedData = validFields.reduce((acc, field) => {
      if (field in sessionData) {
        acc[field] = sessionData[field as keyof typeof sessionData] ?? null;
      }
      return acc;
    }, {} as Record<string, string | number | string[] | null | "IN_PERSON" | "ONLINE" | "BOTH">);

    // Obtener el profesional basado en clerkId
    const professional = await prisma.professional.findUnique({
      where: { clerkId },
    });

    if (!professional) {
      throw new Error("El profesional no existe.");
    }

    // Verificar si ya existe un registro de sesión para el profesional
    let session = await prisma.professionalSessionDetail.findUnique({
      where: { professionalId: professional.id },
    });

    if (!session) {
      // Si no existe, crear un nuevo registro
      session = await prisma.professionalSessionDetail.create({
        data: {
          clerkId, // Incluir clerkId
          professionalId: professional.id,
          ...sanitizedData,
        },
      });
    } else {
      // Si existe, actualizar los datos
      session = await prisma.professionalSessionDetail.update({
        where: { id: session.id },
        data: sanitizedData,
      });
    }

    return session;
  } catch (error) {
    console.error(
      "Error al establecer información de la sesión profesional:",
      error
    );
    throw new Error(
      "No se pudo establecer la información de la sesión profesional."
    );
  }
};
