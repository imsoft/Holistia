"use server";

import prisma from "@/lib/db";

export const getprofessionalSessionDetailInfo = async (clerkId: string) => {
  try {
    const professionalSessionDetail = await prisma.professionalSessionDetail.findFirst({
      where: {
        clerkId,
      },
    });
    return professionalSessionDetail;
  } catch (error) {
    console.error("Error fetching professionalSessionDetail info:", error);
    return null;
  }
};
