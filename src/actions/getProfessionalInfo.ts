"use server";

import prisma from "@/lib/db";

export const getProfessionalInfo = async (clerkId: string) => {
  try {
    const professional = await prisma.professional.findFirst({
      where: {
        clerkId,
      },
    });
    return professional;
  } catch (error) {
    console.error("Error fetching professional info:", error);
    return null;
  }
};
