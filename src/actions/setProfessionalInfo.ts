"use server";

import prisma from "@/lib/db";

export const setProfessionalInfo = async (
  clerkId: string,
  professionalData: Partial<{
    specialty: string | null;
    focusAreas: string | null;
    aspect: string | null;
    therapyType: "TRADITIONAL" | "ALTERNATIVE" | "BOTH" | null;
    languages: string | null;
    qualification: number | null;
    clinicalQuestionnaireAttachment: string | null;
    approved: boolean | null;
  }> = {}
) => {
  try {
    // Filtrar campos válidos
    const validFields = [
      "specialty",
      "focusAreas",
      "aspect",
      "therapyType",
      "languages",
      "qualification",
      "clinicalQuestionnaireAttachment",
      "approved",
    ] as const;

    const sanitizedData = validFields.reduce((acc, field) => {
      if (field in professionalData) {
        acc[field] =
          professionalData[field as keyof typeof professionalData] ?? null;
      }
      return acc;
    }, {} as Record<string, string | number | boolean | null | "TRADITIONAL" | "ALTERNATIVE" | "BOTH">);

    // Verificar si ya existe un registro profesional para el usuario
    let professional = await prisma.professional.findFirst({
      where: { clerkId },
    });

    if (!professional) {
      // Si no existe, crear un nuevo registro
      professional = await prisma.professional.create({
        data: {
          clerkId,
          ...sanitizedData,
        },
      });
    } else {
      // Si existe, actualizar los datos
      professional = await prisma.professional.update({
        where: { id: professional.id },
        data: sanitizedData,
      });
    }

    return professional;
  } catch (error) {
    console.error("Error al establecer información profesional:", error);
    throw new Error("No se pudo establecer la información profesional.");
  }
};
