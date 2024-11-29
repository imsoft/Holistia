import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
  return (
    <>
      <Link href={"/categories"}>
        <Image
          alt="Holistia"
          className="hidden md:block cursor-pointer w-9 h-auto"
          src={
            "https://res.cloudinary.com/dwibt7nyu/image/upload/v1726956022/H_Negro_ja7utg.svg"
          }
          height={30}
          width={30}
          priority
        />
      </Link>
    </>
  );
};
