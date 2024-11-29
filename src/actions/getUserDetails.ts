"use server";

import prisma from "@/lib/db";

export const getUserDetails = async (clerkId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { clerkId },
    select: {
      approved: true,
    },
  });

  return {
    isProfessional: Boolean(professional), // Si el usuario tiene un registro en Professional
    approved: professional?.approved ?? false, // Estado de aprobación
  };
};
