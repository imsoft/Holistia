import type { Metadata } from "next";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "/logos/holistia-logo-square-black.png",
        width: 512,
        height: 512,
        alt: "Holistia",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logos/holistia-logo-square-black.png"],
  },
};

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
