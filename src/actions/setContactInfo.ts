"use server";

import prisma from "@/lib/db";

export const setContactInfo = async (
  clerkId: string,
  contactData: Partial<{
    facebookUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    threadsUrl: string | null;
    youtubeUrl: string | null;
    xUrl: string | null;
    linkedinUrl: string | null;
    phoneNumber: string | null;
  }> = {}
) => {
  try {
    // Campos válidos para contacto
    const validFields = [
      "facebookUrl",
      "instagramUrl",
      "tiktokUrl",
      "threadsUrl",
      "youtubeUrl",
      "xUrl",
      "linkedinUrl",
      "phoneNumber",
    ] as const;

    // Filtrar campos válidos del input
    const sanitizedData: Partial<typeof contactData> = {};
    for (const key of Object.keys(contactData) as Array<
      keyof typeof contactData
    >) {
      if (validFields.includes(key)) {
        sanitizedData[key] = contactData[key];
      }
    }

    // Verificar si ya existe un registro de contacto para el usuario
    let contact = await prisma.contact.findFirst({
      where: { clerkId },
    });

    if (!contact) {
      // Si no existe, crear un nuevo registro
      contact = await prisma.contact.create({
        data: {
          clerkId,
          ...sanitizedData,
        },
      });
    } else {
      // Si existe, actualizar los datos
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: sanitizedData,
      });
    }

    return contact;
  } catch (error) {
    console.error("Error al establecer información de contacto:", error);
    throw new Error("No se pudo establecer la información de contacto.");
  }
};
