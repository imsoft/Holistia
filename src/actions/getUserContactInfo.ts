"use server";

import prisma from "@/lib/db";

export const getContactInfo = async (clerkId: string) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        clerkId,
      },
    });
    return contact;
  } catch (error) {
    console.error("Error fetching contact info:", error);
    return null;
  }
};
