"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IconType } from "react-icons";

interface CategoryBoxProps {
  label: string;
  icon: IconType;
  selected?: boolean;
}

export const CategoryBox = ({
  label,
  icon: Icon,
  selected,
}: CategoryBoxProps) => {
  const router = useRouter();
  const params = useSearchParams();

  const handleClick = () => {
    const queryParams = new URLSearchParams(params);

    // Si la categoría ya está seleccionada, la removemos
    if (selected) {
      queryParams.delete("category");
    } else {
      // Si no está seleccionada, la agregamos
      queryParams.set("category", label || "");
    }

    // Si no hay más parámetros, volvemos a la página principal
    const newUrl = queryParams.toString() ? `/categories/?${queryParams.toString()}` : "/categories";
    router.push(newUrl);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 border-b-2 hover:text-holistia-800 transition cursor-pointer
        ${selected ? "border-b-holistia-800" : "border-transparent"} 
        ${selected ? "text-neutral-800" : "text-neutral-500"} 
        `}
    >
      <Icon size={26} />
      <div
        className={`font-medium text-sm ${
          selected ? "text-neutral-800" : "text-neutral-500"
        } `}
      >
        {label}
      </div>
    </div>
  );
};
