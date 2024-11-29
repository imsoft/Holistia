import { Navbar } from "@/components/navbar";
import { Suspense } from "react";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
        <main className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4 pt-[64px]">
          {children}
        </main>
      </Suspense>
    </div>
  );
}
