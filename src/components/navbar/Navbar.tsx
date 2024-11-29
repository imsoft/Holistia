"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Categories, Logo } from ".";

import { FaRegUserCircle } from "react-icons/fa";

export const Navbar = () => {
  const router = useRouter();

  return (
    <>
      <div className="w-full bg-white z-10 shadow-sm">
        <div className="py-4 border-b-[1px]">
          <div className="relative flex items-center justify-center">
            <div className="flex justify-center">
              <Logo />
            </div>

            <div className="absolute right-20">
              <SignedIn>
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Perfil"
                      labelIcon={<FaRegUserCircle size={15} />}
                      onClick={() => {
                        router.push("/profile");
                      }}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </div>
          </div>
          <Categories />
        </div>
      </div>
    </>
  );
};
