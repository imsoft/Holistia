"use server";

import prisma from "@/lib/db";

export const updateImage = async (clerkId: string, newImages: string[]) => {
  try {
    // Obtener el profesional basado en clerkId
    const professional = await prisma.professional.findUnique({
      where: { clerkId },
    });

    if (!professional) {
      throw new Error("El profesional no existe.");
    }

    // Actualizar imágenes en la sesión del profesional
    const updatedSession = await prisma.professionalSessionDetail.update({
      where: { professionalId: professional.id },
      data: {
        consultoryImages: newImages,
      },
    });

    return updatedSession;
  } catch (error) {
    console.error("Error al actualizar imágenes:", error);
    throw new Error("No se pudo actualizar las imágenes.");
  }
};

export const deleteImage = async (clerkId: string, imageUrl: string) => {
  try {
    // Obtener el profesional basado en clerkId
    const professional = await prisma.professional.findUnique({
      where: { clerkId },
    });

    if (!professional) {
      throw new Error("El profesional no existe.");
    }

    // Obtener la sesión del profesional
    const session = await prisma.professionalSessionDetail.findUnique({
      where: { professionalId: professional.id },
    });

    if (!session) {
      throw new Error("La sesión profesional no existe.");
    }

    // Filtrar la imagen a eliminar
    const updatedImages = session.consultoryImages.filter(
      (img: string) => img !== imageUrl
    );

    // Actualizar las imágenes en la base de datos
    const updatedSession = await prisma.professionalSessionDetail.update({
      where: { id: session.id },
      data: {
        consultoryImages: updatedImages,
      },
    });

    return updatedSession;
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    throw new Error("No se pudo eliminar la imagen.");
  }
};
