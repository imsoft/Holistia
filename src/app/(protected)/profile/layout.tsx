"use client";

import { cn } from "@/lib/utils";
import { IoDocumentText } from "react-icons/io5";
import { usePathname } from "next/navigation";
import { FaMap, FaUserDoctor } from "react-icons/fa6";
import { MdContactEmergency } from "react-icons/md";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getUserDetails } from "@/actions";

const secondaryNavigation = (isProfessional: boolean, approved: boolean) => [
  {
    name: "Contacto",
    href: "/profile",
    icon: MdContactEmergency,
  },
  { name: "Ubicación", href: "/profile/location", icon: FaMap },
  {
    name: "Profesional",
    href: approved ? "/profile/professional" : "/profile/request-professional",
    icon: FaUserDoctor,
  },
  ...(approved
    ? [
        {
          name: "Sesión Médica",
          href: "/profile/medical-session",
          icon: IoDocumentText,
        },
      ]
    : []),
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState<{
    isProfessional: boolean;
    approved: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (user?.id) {
        const details = await getUserDetails(user.id);
        setUserDetails(details);
      }
    };

    fetchDetails();
  }, [user]);

  const isProfessional = userDetails?.isProfessional || false;
  const approved = userDetails?.approved || false;

  const navigationItems = secondaryNavigation(isProfessional, approved);

  return (
    <>
      <div className="mx-auto max-w-7xl lg:flex lg:gap-x-16 lg:px-8">
        <h1 className="sr-only">General Settings</h1>

        <aside className="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-64 lg:flex-none lg:border-0 lg:py-5">
          <nav className="flex-none px-4 sm:px-6 lg:px-0">
            <ul
              role="list"
              className="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col"
            >
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      item.href === pathname
                        ? "bg-gray-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600",
                      "group flex gap-x-3 rounded-md py-2 pl-2 pr-3 text-sm font-semibold leading-6"
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={cn(
                        item.href === pathname
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-blue-600",
                        "h-6 w-6 shrink-0"
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="px-4 py-16 sm:px-6 lg:flex-auto lg:px-0 lg:py-5">
          {children}
        </main>
      </div>
    </>
  );
}
