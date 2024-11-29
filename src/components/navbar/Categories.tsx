"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { CategoryBox } from "../shared";
import { categories } from "@/data";

export const Categories = () => {
  const params = useSearchParams();
  const category = params?.get("category");
  const pathName = usePathname();

  const isMainPage = pathName === "/categories";

  if (!isMainPage) {
    return null;
  }

  return (
    <>
      <div className="pt-8 flex flex-row items-center justify-around overflow-x-auto">
        {categories.map((item) => (
          <CategoryBox
            key={item.label}
            label={item.label}
            icon={item.icon}
            selected={category === item.label}
          />
        ))}
      </div>
    </>
  );
};
