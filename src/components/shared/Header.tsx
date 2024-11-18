"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// const navigation = [
//   { name: "FAQ", href: "#" },
// ];

export const Header = () => {
  return (
    <>
      <header className="bg-white">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-start gap-x-6 p-6 lg:px-8"
        >
          <div className="flex">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <Image
                alt=""
                src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1726956022/H_Negro_ja7utg.svg"
                className="h-10 w-auto"
                width={32}
                height={32}
              />
            </Link>
          </div>
          {/* <div className="hidden ml-6 lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm/6 font-semibold text-gray-900"
              >
                {item.name}
              </Link>
            ))}
          </div> */}

          {/* <div className="flex lg:hidden">
            <Button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <IoMenu aria-hidden="true" className="size-6" />
            </Button>
          </div> */}
        </nav>
        {/* <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-10" />
          <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center gap-x-6">
              <Link href="#" className="-m-1.5 p-1.5">
                <span className="sr-only">Your Company</span>
                <Image
                  alt=""
                  src="https://tailwindui.com/plus/img/logos/mark.svg?color=blue&shade=600"
                  className="h-8 w-auto"
                  width={32}
                height={32}
                />
              </Link>
              <Link
                href="#"
                className="ml-auto rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Sign up
              </Link>
              <Button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  <Link
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog> */}
      </header>
    </>
  );
};
