"use client";

import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { FaRegUserCircle } from "react-icons/fa";

export const Header = () => {
  const router = useRouter();
  
  return (
    <>
      <header className="bg-white">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 lg:px-8"
        >
          <div className="flex">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Holistia</span>
              <Image
                alt=""
                src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1726956022/H_Negro_ja7utg.svg"
                className="h-10 w-auto"
                width={32}
                height={32}
              />
            </Link>
          </div>
          <div className="hidden gap-4 items-center lg:flex">
            <SignedOut>
              <SignUpButton>
                <Button variant={"outline"}>Registrate</Button>
              </SignUpButton>
              <SignInButton>
                <Button>Iniciar Sesión</Button>
              </SignInButton>
            </SignedOut>
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
        </nav>
      </header>
    </>
  );
};
