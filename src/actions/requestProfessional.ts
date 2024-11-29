"use server";

import prisma from "@/lib/db";

export const requestProfessional = async (clerkId: string) => {
  try {
    await prisma.professional.upsert({
      where: { clerkId },
      create: {
        clerkId,
        approved: true, // Aprobado automáticamente
      },
      update: {
        approved: true, // Asegurar que cualquier actualización también sea aprobada
      },
    });
    return {
      success: true,
      message: "Solicitud enviada y aprobada correctamente.",
    };
  } catch (error) {
    console.error(error);
    throw new Error("Error al procesar la solicitud.");
  }
};
