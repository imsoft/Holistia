"use server";

import prisma from "@/lib/db";

export const getLocationInfo = async (clerkId: string) => {
  try {
    const location = await prisma.location.findFirst({
      where: {
        clerkId,
      },
    });
    return location;
  } catch (error) {
    console.error("Error fetching location info:", error);
    return null;
  }
};
