"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Explorar", href: "/explore" },
  { name: "Empresas", href: "/companies" },
  { name: "Blog", href: "/blog" },
  { name: "Historia", href: "/history" },
  { name: "Contacto", href: "/contact" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full z-50">
      <nav
        aria-label="Global"
        className="flex items-center justify-between p-6 lg:px-8 bg-primary w-full"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Holistia</span>
            <Image
              alt="Holistia Logo"
              src="/logos/holistia-white.png"
              width={32}
              height={32}
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground"
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex items-center justify-between p-6 pb-4">
                <Link href="/" className="-m-1.5 p-1.5">
                  <span className="sr-only">Holistia</span>
                  <Image
                    alt="Holistia Logo"
                    src="/logos/holistia-black.png"
                    width={32}
                    height={32}
                    style={{ width: "auto", height: "auto" }}
                  />
                </Link>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block rounded-lg px-3 py-3 text-base font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border space-y-1">
                  <Link
                    href="/become-professional"
                    className="block rounded-lg px-3 py-3 text-base font-semibold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    ¿Eres profesional?
                  </Link>
                  <Link
                    href="/login"
                    className="block rounded-lg px-3 py-3 text-base font-semibold text-foreground hover:bg-accent transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm/6 font-semibold text-primary-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
          <Link 
            href="/become-professional" 
            className="rounded-md bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary-foreground/90 transition-colors"
          >
            ¿Eres profesional?
          </Link>
          <Link href="/login" className="text-sm/6 font-semibold text-primary-foreground">
            Iniciar sesión <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
    </header>
  );
};
