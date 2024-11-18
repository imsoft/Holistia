import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";

const navigation = {
  // main: [
  //   { name: "FAQ", href: "#" },
  // ],
  social: [
    {
      name: "Facebook",
      href: "#",
      icon: FaFacebook,
    },
    {
      name: "Instagram",
      href: "#",
      icon: FaInstagram,
    },
    {
      name: "Linkedin",
      href: "#",
      icon: FaLinkedin,
    },
    {
      name: "Pinterest",
      href: "#",
      icon: FaPinterest,
    },
    {
      name: "Threads",
      href: "#",
      icon: FaThreads,
    },
    {
      name: "Tiktok",
      href: "#",
      icon: FaTiktok,
    },
    {
      name: "YouTube",
      href: "#",
      icon: FaYoutube,
    },
  ],
};

export const Footer = () => {
  return (
    <>
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
          {/* <nav
            aria-label="Footer"
            className="-mb-6 flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm/6"
          >
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900"
              >
                {item.name}
              </Link>
            ))}
          </nav> */}
          <div className="mt-16 flex justify-center gap-x-10">
            {navigation.social.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                className="text-gray-600 hover:text-gray-800"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon aria-hidden="true" className="size-6" />
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center text-sm/6 text-gray-600">
            &copy; 2024 Holistia, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};
